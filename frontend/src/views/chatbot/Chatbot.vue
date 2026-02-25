<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Bot,  
  RotateCcw,  
  CheckCircle2, 
  Info, 
  ArrowRightCircle, 
  MessageSquareText 
} from 'lucide-vue-next'
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
const lernsetId = ref("EYydiIexN5xZHOJcmp32")

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
  
  console.log("checkAnswer Vokabeln updated")
  // Logik für zweite Chance
  if(firstAttempt.value && data.rating !== "correct") {
      // Beim ersten Fehlversuch nur Tipp anzeigen
      feedback.value = data.hint || "Überprüfe deine Antwort noch einmal."
      comment.value = ""
      suggestion.value = ""
      rating.value = ""
      firstAttempt.value = false
      // Feedback in Historie-Array speichern
      saveMessage("assistant", feedback.value, "feedback")
  } else {
      // Zweiter Versuch oder korrekt -> volles Feedback
      feedback.value = data.feedback
      comment.value = data.comment
      suggestion.value = data.suggestion 
      rating.value = data.rating 
      // Feedback in Historie-Array speichern
      saveMessage("assistant", JSON.stringify({
        feedback: data.feedback,
        comment: data.comment,
        suggestion: data.suggestion,
        rating: data.rating
      }), "feedback")
      console.log(comment.value + " " + suggestion.value)
      // TODO: Auswahl zeigen, die nächste Vokabel zu zeigen ODER automatisch nächste Vokabel anzeigen
      await nextVokabel()
  }

  
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
  <div class="w-full h-[calc(100vh-60px)] flex flex-col p-2 md:p-3 pb-1 gap-2 bg-[var(--color-surface)] overflow-hidden">
    
    <div class="flex items-center justify-between px-4 py-2 border-b border-[var(--color-primary-variant)]/20 bg-white/50 backdrop-blur-sm rounded-t-xl">
      <div class="flex items-center gap-3">
        <div class="p-1.5 bg-[var(--color-primary)] rounded-lg text-white shadow-sm">
          <Bot :size="25" />
        </div>
        <div>
          <h1 class="text-base font-bold text-[var(--color-surface-foreground)] leading-tight">Lingotrain AI</h1>
          <p class="text-[10px] text-[var(--color-secondary-foreground)] uppercase tracking-widest font-bold opacity-60">Vokabel-Kontext</p>
        </div>
      </div>
      <Button @click="resetSession" variant="ghost" size="sm" class="h-8 text-[var(--color-warning)] hover:bg-[var(--color-warning)]/10 text-[11px] font-bold transition-all">
        <RotateCcw :size="14" class="mr-1.5" /> RESET
      </Button>
    </div>

    <div class="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-950 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-[var(--color-secondary-variant)]/40 overflow-hidden">
      
      <div ref="chatContainer" class="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar [background-size:20px_20px] dark:bg-none">
        
        <div v-for="(msg, index) in messages" :key="index"
             :class="['flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300', msg.role === 'user' ? 'justify-end' : 'justify-start']">
          
          <div :class="[
            'max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-sm md:text-base shadow-sm border transition-all border-transparent rounded-tr-none',
            msg.role === 'user' 
              ? 'bg-[var(--color-primary)]/90 text-[var(--color-primary-foreground)] ' 
              : 'bg-[var(--color-secondary)]/90 text-[var(--color-secondary-foreground)]'
          ]">
            <div v-if="msg.type === 'sentence'" class="flex items-center gap-1 text-[9px] font-black opacity-50 uppercase mb-1 tracking-wider">
              <MessageSquareText :size="12" /> Aufgabe
            </div>

            <p class="font-medium">{{ msg.content }}</p>

            <div v-if="msg.type === 'feedback' && index === messages.length - 1" class="mt-2.5 pt-2.5 border-t border-black/5 space-y-2">
               <p v-if="suggestion" class="text-xs bg-[var(--color-primary)]/5 p-2 rounded-lg italic border border-[var(--color-primary)]/10 flex items-start gap-2">
                <Info :size="12" class="mt-0.5 shrink-0 text-[var(--color-primary)]" /> 
                <span class="opacity-90">{{ suggestion }}</span>
               </p>
               
               <div class="flex items-center gap-3">
                 <span v-if="rating" :class="[
                   'px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm',
                   rating === 'correct' ? 'bg-[var(--color-success)] text-white' : 'bg-[var(--color-warning)] text-white'
                 ]">
                   <CheckCircle2 :size="10" v-if="rating === 'correct'" /> {{ rating.replace('_', ' ') }}
                 </span>
                 <span v-if="comment" class="text-[11px] font-semibold opacity-50 italic truncate">{{ comment }}</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div class="p-3 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-md border-t border-[var(--color-secondary-variant)]/30">
        <div class="w-full flex flex-col gap-2">
          <div class="relative flex items-center">
            <Input 
              v-model="userInput"
              @keyup.enter="checkAnswer"
              :disabled="loading || vkStore.rundeFertig"
              placeholder="Antwort tippen..."
              class="h-11 text-sm pl-4 pr-28 rounded-xl border-2 focus-visible:ring-[var(--primary)]/60  bg-white shadow-sm transition-all"
            />
            <Button 
              @click="checkAnswer" 
              :disabled="loading || !userInput || vkStore.rundeFertig"
              class="absolute right-1.5 h-8 px-4 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-xs font-bold rounded-lg shadow-md hover:brightness-110 transition-all"
            > 
              Überprüfen
            </Button>
          </div>
          
          <div class="flex justify-between items-center h-5">
            <Button 
              variant="ghost"
              v-if="!vkStore.rundeFertig && messages.length > 0"
              @click="loadSentence" 
              class="text-[11px] font-black text-[var(--color-primary)] flex items-center gap-1.5 hover:gap-2.5 hover:text-[var(--color-primary)] transition-all uppercase tracking-tight"
            >
              <ArrowRightCircle :size="12" /> Nächste Vokabel
            </Button>
            <div v-else-if="vkStore.rundeFertig" class="flex items-center gap-1.5 text-[var(--color-success)] text-[10px] font-black uppercase">
               <CheckCircle2 :size="12" /> Runde beendet
            </div>
            
            <div class="text-[9px] text-muted-foreground opacity-40 font-bold flex items-center gap-1.5 uppercase">
              <span>Senden</span>
              <kbd class="hidden sm:inline-block border rounded px-1 py-0.5 bg-white text-[9px] shadow-sm">ENTER ↵</kbd>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scrollbar etwas dezenter */
.custom-scrollbar::-webkit-scrollbar { width: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
</style>