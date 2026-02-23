<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useVkStore } from "@/stores/vokabelKontoStore"
import { useKontoStore } from "@/stores/kontoStore"
import type { Vokabeln } from "@/models/Vokabeln"

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

// TODO: lernset dynamisch setzen
const lernsetId = ref("KZiUsoL2fYyi4U3ezGKr")

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

/** Beim Mount Vokabeln laden und Runde zurücksetzen */
onMounted(async () => {
    vkStore.resetRunde()
    await vkStore.ladeVokabeln(lernsetId.value)
})

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
  if(isRundeFertig.value) {
    vkStore.resetRunde()
    console.log("Keine offene Vokabeln mehr")
    return
  }

  // wenn Vokabel ein Satz ist, nächste Vokabel holen
  while (!vokabel.value?.isWort) {
    console.log("KEIN WORT --- Konto: " + kontoId.value + "; Sprache: " + aktuelleSprache.value?.sprache + "; Vokabel: " + vokabel.value?.vokabel)
    vkStore.nextFrage()
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

  sentence.value = data.sentence
  loading.value = false
  firstAttempt.value = true
  feedback.value = ""
  comment.value = ""
  suggestion.value = ""
  rating.value = ""
  userInput.value = ""
}

/**
 * Lädt die nächste Vokabel im Lernset.
 * 
 * // TODO: diese automatisch nach der zweiter Versuch/richtige Antwort aufrufen; erstmal manuell per Button-Klick
 */
function nextVokabel() {
  feedback.value = ""
  userInput.value = ""
  vkStore.nextFrage()
  loadSentence()
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
  }
  loading.value = false
}

</script>

<template>
  <h1>Chatbot</h1>

  <Button @click="loadSentence" :disabled="loading">
    Satz generieren
  </Button>

  <p v-if="loading">Lade...</p>
  <p v-if="sentence">{{ sentence }}</p>

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

  <Button @click="nextVokabel" :disabled="loading">
    Nächste Vokabel
  </Button>

</template>
