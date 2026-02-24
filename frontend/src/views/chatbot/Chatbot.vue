<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useVkStore } from "@/stores/vokabelKontoStore"
import { useKontoStore } from "@/stores/kontoStore"
import type { Vokabeln } from "@/models/Vokabeln"
import type { ChatMessage } from "@/models/ChatMessage"

// --- Stores initialisieren ---
const vkStore = useVkStore()
const kontoStore = useKontoStore()

// --- Reaktive State-Variablen ---
/** Vom Backend generierter Satz */
const sentence = ref("")
/** Ladezustand für UI */
const loading = ref(false)
/** Antwort des Benutzers */
const userInput = ref("")
/** Für UI-Feedback vom Evaluator */
const feedback = ref("")
/** Technische Begründung */
const comment = ref("")
/** Korrekturvorschlag */
const suggestion = ref("")
/** Bewertung (correct/almost_correct/wrong) */
const rating = ref("") 
/** Flag für ersten Versuch */
const firstAttempt = ref(true)
/** Chatverlauf */
const messages = ref<ChatMessage[]>([])

// TODO: lernset dynamisch setzen
const lernsetId = ref("wNow2k3gBJDuucdMPzci")

// --- Computed Properties ---
/** ID des aktuellen Kontos */
const kontoId = computed(() => kontoStore.aktuellesKonto?.id);
/** aktuelle Lernsprache */
const aktuelleSprache = computed(() => kontoStore.aktuelleSprache);
/** aktuelle Vokabel */
const vokabel = computed<Vokabeln | null>(() => vkStore.aktuelleFrage ?? null)
/** Prüft, ob die Runde beendet ist */
const isRundeFertig = computed<boolean>(() => vkStore.rundeFertig)

/** Mapping für ISO-Code für den Evaluator */
const languageMap: Record<string,string> = {
  "Englisch": "en",
  "Deutsch": "de",
  "Französisch": "fr",
  "Spanisch": "es"
}

/** Beim Mount Vokabeln laden, Chatverlauf aus dem Session Storage wiederherstellen (falls vorhanden) und Runde zurücksetzen */
onMounted(async () => {
  const saved = sessionStorage.getItem("chatHistory")
  if (saved) {
    messages.value = JSON.parse(saved)
  }

  vkStore.resetRunde()
  await vkStore.ladeVokabeln(lernsetId.value)
})

/** Chatverlauf bei jeder Änderung im Session Storage persistieren */
watch(messages, (newVal) => {
  sessionStorage.setItem("chatHistory", JSON.stringify(newVal))
}, { deep: true })

/**
 * Lädt einen Satz für die aktuelle Vokabel.
 * 
 * Prüft zunächst, ob die Runde abgeschlossen ist und setzt sie ggf. zurück.
 * Springt über alle Vokablen, die Sätze sind, bis ein Wort gefunden wird.
 * Ruft das Backend über /generate-sentence auf, um ein Satz zu generieren.
 * Bereitet die Vokabel für die erste Eingabe vor.
 * // TODO: wird nach dem Auswahl von Lernset aufgerufen; erstmal manuell per Button-Klick
 */
async function loadSentence() {
  // prüfen, ob die runde schon fertig ist
  if(isRundeFertig.value) {
    console.log("Keine offene Vokabeln mehr")
    // nachricht nur einmalig senden
    const letzteMsg = messages.value[messages.value.length - 1]
    if (!letzteMsg || letzteMsg.content !== "Lernrunde fertig") {
      saveMessage("assistant", "Lernrunde fertig", "feedback")
    }
    return
  }

  // wenn Vokabel ein Satz ist, nächste Vokabel holen
  while (!isRundeFertig.value && !vokabel.value?.isWort) {
    console.log("KEIN WORT --- Konto: " + kontoId.value + "; Sprache: " + aktuelleSprache.value?.sprache + "; Vokabel: " + vokabel.value?.vokabel)
    vkStore.nextFrage()
  }

   // Runde nach Überspringen prüfen
  if (isRundeFertig.value) {
    saveMessage("assistant", "Lernrunde fertig", "feedback")
    return
  }

  // wenn keine Vokabel mit ID vorhanden ist, kann auch kein Satz dazu geladen werden
  if(!vokabel.value?.id)
    return;
  
  console.log("Konto: " + kontoId.value + "; Sprache: " + aktuelleSprache.value?.sprache + "; Vokabel: " + vokabel.value?.vokabel)

  // der Satz soll an einen bestimmten Schwierigkeitsgrad angepasst werden
  const schwierigkeitsgrad = await vkStore.getSchwierigkeitsgrad(vokabel.value.id);

  loading.value = true
  const res = await fetch("http://localhost:8000/generate-sentence", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      word: vokabel.value?.uebersetzung,          // vokabel.uebersetzung ist der deutsche Begriff also hier als Wort gewollt
      uebersetzung: vokabel.value?.vokabel,       // vokabel.vokabel ist der fremdsprachige Begriff also hier als Übersetzung des deutschen Wortes gewollt
      language: aktuelleSprache.value?.sprache,
      schwierigkeitsgrad: schwierigkeitsgrad
    })
  })

  
  const data = await res.json()

  sentence.value = "Übersetzen Sie diesen Satz: " +  data.sentence
  loading.value = false
  firstAttempt.value = true
  feedback.value = ""
  comment.value = ""
  suggestion.value = ""
  rating.value = ""
  userInput.value = ""

  // geladenen Satz in Historie-Array speichern
  saveMessage("assistant", sentence.value, "sentence")
}

/**
 * Lädt die nächste Vokabel im Lernset.
 * 
 * // TODO: diese automatisch nach der zweiter Versuch/richtige Antwort aufrufen; erstmal manuell per Button-Klick
 */
async function nextVokabel() {
  feedback.value = ""
  userInput.value = ""
  vkStore.nextFrage()
  await loadSentence()
}

/**
 * Prüft die Eingabe des Nutzers auf Korrektheit.
 * 
 * Sendet die Benutzereingabe zusammen mit dem generierten Satz und der Zielvokaben an das Backend /evaluate-answer.
 * Verarbeitet das Feedback:
 * - Beim ersten Fehlversuch nur Hinweis anzeigen
 * - Bei zweitem Versuch oder korrekter Antwort volles Feedback, Kommentare, Vorschlag und Bewertung
 * 
 */
async function checkAnswer() {
  if (!vokabel.value || !userInput.value) return

  loading.value = true

  // Benutereingabe in Chatverlauf speichern
  saveMessage("user", userInput.value, "answer")

  const res = await fetch("http://localhost:8000/evaluate-answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_answer: userInput.value,
      original_sentence: sentence.value,
      target_word: vokabel.value.vokabel,
      target_language: languageMap[aktuelleSprache.value?.sprache]
    })
  })

  const data = await res.json()

  // erster Versuch entscheidet über den Status der Vokabel, der in der DB gesetzt werden soll
  // da der Nutzer ansonsten Hinweise hatte und es nicht alleine richtig hatte
  if(firstAttempt.value) {
    vkStore.frageBeantwortet(data.correct);
  }

  // Logik für zweite Chance
  if(firstAttempt.value && data.rating !== "correct") {
      // Beim ersten Fehlversuch nur Tipp anzeigen
      feedback.value = data.hint || "Überprüfe deine Antwort noch einmal."
      comment.value = ""
      suggestion.value = ""
      rating.value = ""
      firstAttempt.value = false
  } else {
      // Zweiter Versuch oder korrekt -> volles Feedback
      feedback.value = data.feedback
      comment.value = data.comment || ""
      suggestion.value = data.suggestion || ""
      rating.value = data.rating || ""
      // TODO: Auswahl zeigen, die nächste Vokabel zu zeigen ODER automatisch nächste Vokabel anzeigen
      await nextVokabel()
  }

  // Feedback in Historie-Array speichern
  saveMessage("assistant", feedback.value, "feedback")
  loading.value = false
}

/**
 * Fügt eine neue Nachricht dem Chat-Verlauf hinzu.
 * 
 * 
 * @param new_role Rolle des Absenders ("assistant" oder "user")
 * @param new_content Textinhalt der Nachricht
 * @param new_type Kategorie der Nachricht ("sentence", "answer" oder "feedback")
 */
function saveMessage(new_role: ChatMessage["role"], new_content: string, new_type: ChatMessage["type"]) {
  messages.value.push({
    role: new_role,
    content: new_content,
    type: new_type
  })
}

async function resetSession() {
  // Chat-Historie leeren
  messages.value = []

  // SessionStorage löschen
  sessionStorage.removeItem("chatHistory")

  // UI-State zurücksetzen
  sentence.value = ""
  userInput.value = ""
  feedback.value = ""
  comment.value = ""
  suggestion.value = ""
  rating.value = ""
  firstAttempt.value = true

  // Lernrunde zurücksetzen
  vkStore.resetRunde()
  await vkStore.ladeVokabeln(lernsetId.value)
}

</script>

<template>
  <h1>Chatbot</h1>

  <Button @click="loadSentence" :disabled="loading">
    Satz generieren
  </Button>

  <p v-if="loading">Lade...</p>
  <!-- <p v-if="sentence">{{ sentence }}</p> -->

  <div class="chat-container">
    <div v-for="(msg, index) in messages" :key="index"
        :class="msg.role === 'user' ? 'user-msg' : 'assistant-msg'">

      <p>{{ msg.content }}</p>

    </div>
  </div>

  <Input v-model="userInput"
          placeholder="Fehlendes Wort eingeben…"
          :disabled="loading"
          class="h-20 sm:h-28 sm:text-xl md:text-xl text-center font-bold bg-secondary/20 border-2 border-transparent focus-visible:border-secondary focus-visible:ring-0 transition-all rounded-2xl shadow-inner w-full"
          autofocus>
    </Input>

    <Button @click="checkAnswer" :disabled="loading">
      Senden
    </Button>

    <div v-if="feedback">
      <p><strong>Feedback:</strong> {{ feedback }}</p>
      <p v-if="suggestion"><strong>Vorschlag:</strong> {{ suggestion }}</p>
      <p v-if="comment"><em>Kommentar:</em> {{ comment }}</p>
      <p v-if="rating"><em>Bewertung:</em> {{ rating }}</p>
  </div>

  <Button @click="resetSession" variant="destructive">
    Session zurücksetzen
  </Button>

</template>

<style>
  .user-msg {
    text-align: right;
    background: #d1e7dd;
    padding: 8px;
    border-radius: 12px;
    margin: 6px 0;
  }

  .assistant-msg {
    text-align: left;
    background: #f8d7da;
    padding: 8px;
    border-radius: 12px;
    margin: 6px 0;
  }
</style>
