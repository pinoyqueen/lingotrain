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
      saveMessage("assistant", data.feedback, "feedback", {
        suggestion: data.suggestion,
        rating: data.rating,
        comment: data.comment
      })
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
function saveMessage(new_role: ChatMessage["role"], new_content: string, new_type: ChatMessage["type"], details?: any) {
  messages.value.push({
    role: new_role,
    content: new_content,
    type: new_type,
    details: details
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
    
    <div class="flex items-center justify-between px-4 py-2 border-b border-[var(--color-primary-variant)]/20 bg-white/50 backdrop-blur-sm rounded-t-xl shrink-0">
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
      
      <div ref="chatContainer" class="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 pb-12 custom-scrollbar [background-size:20px_20px] dark:bg-none">
        
        <div v-if="messages.length === 0" class="h-full flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
          <div class="max-w-sm w-full p-8 rounded-3xl border-2 border-dashed border-[var(--color-primary-variant)]/20 flex flex-col items-center text-center">
            <div class="w-16 h-16 bg-[var(--color-primary)]/10 rounded-full flex items-center justify-center mb-4">
              <MessageSquareText :size="32" class="text-[var(--color-primary)]" />
            </div>
            <h2 class="text-xl font-bold text-[var(--color-surface-foreground)] mb-2">Bereit für dein Training?</h2>
            <p class="text-sm text-[var(--color-secondary-foreground)] opacity-70 mb-6 leading-relaxed">
              Lass uns Sätze bilden! Klicke auf den Button unten, um deine erste Vokabel in einem Kontext-Satz zu üben.
            </p>
            <Button variant="primary" @click="loadSentence" :disabled="loading" class="px-8 py-6 rounded-2xl shadow-lg">
              <Bot :size="30" class="mr-2" />
              Ersten Satz generieren
            </Button>
          </div>
        </div>

        <div v-for="(msg, index) in messages" :key="index"
             :class="['flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300', msg.role === 'user' ? 'justify-end' : 'justify-start']">
          
          <div :class="[
            'max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm md:text-base shadow-sm border transition-all border-transparent rounded-tr-none',
            msg.role === 'user' 
              ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]' 
              : 'bg-[var(--color-secondary)]/90 text-[var(--color-secondary-foreground)]'
          ]">
            <div v-if="msg.type === 'sentence'" class="flex items-center gap-1 text-[9px] font-black opacity-50 uppercase mb-1 tracking-wider">
              <MessageSquareText :size="12" /> Aufgabe
            </div>

            <p class="font-medium leading-relaxed">{{ msg.content }}</p>

            <div v-if="msg.type === 'feedback' && msg.details" class="mt-3 pt-3 border-t border-black/5 space-y-3">
               <p v-if="msg.details.suggestion" class="text-xs bg-white/50 p-2.5 rounded-lg italic border border-black/5 flex items-start gap-2 shadow-inner">
                <Info :size="14" class="mt-0.5 shrink-0 text-[var(--color-primary)]" /> 
                <span class="opacity-90 leading-normal">{{ msg.details.suggestion }}</span>
               </p>
               
               <div class="flex flex-wrap items-center gap-2">
                 <span v-if="msg.details.rating" :class="[
                   'px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm',
                   msg.details.rating === 'correct' ? 'bg-[var(--color-success)] text-white' : 'bg-[var(--color-warning)] text-white'
                 ]">
                   <CheckCircle2 :size="10" v-if="msg.details.rating === 'correct'" /> {{ msg.details.rating.replace('_', ' ') }}
                 </span>
                 <span v-if="msg.details.comment" class="text-[11px] font-semibold opacity-60 italic leading-snug">{{ msg.details.comment }}</span>
               </div>
            </div>
          </div>
        </div>
        <div class="h-2"></div>
      </div>

      <div class="p-3 bg-zinc-50/90 dark:bg-zinc-900/90 backdrop-blur-md border-t border-[var(--color-secondary-variant)]/30 shrink-0">
        <div class="w-full flex flex-col gap-2">
          <div class="relative flex items-center">
            <Input 
              v-model="userInput"
              @keyup.enter="checkAnswer"
              :disabled="loading || vkStore.rundeFertig"
              placeholder="Antwort tippen..."
              class="h-12 text-sm pl-4 pr-32 rounded-xl border-2 focus-visible:ring-[var(--primary)]/60 bg-white shadow-sm transition-all"
            />
            <Button 
              variant="primary"
              @click="checkAnswer" 
              :disabled="loading || !userInput || vkStore.rundeFertig"
              class="absolute right-1.5 h-9 px-4 text-xs rounded-lg shadow-md font-bold"
            > 
              Überprüfen
            </Button>
          </div>
          
          <div class="flex justify-between items-center h-6 px-1">
            <div class="flex items-center">
              <Button 
                variant="ghost"
                v-if="!vkStore.rundeFertig && messages.length > 0"
                @click="loadSentence" 
                class="text-[11px] font-black text-[var(--color-primary)] flex items-center gap-1.5 hover:gap-2.5 transition-all uppercase tracking-tight h-auto p-0 bg-transparent"
              >
                <ArrowRightCircle :size="14" /> Nächste Vokabel
              </Button>
              <div v-else-if="vkStore.rundeFertig" class="flex items-center gap-1.5 text-[var(--color-success)] text-[10px] font-black uppercase">
                <CheckCircle2 :size="14" /> Runde beendet
              </div>
            </div>
            
            <div class="text-[9px] text-muted-foreground opacity-50 font-bold flex items-center gap-1.5 uppercase ml-auto">
              <span>Senden mit</span>
              <kbd class="hidden sm:inline-block border rounded px-1.5 py-0.5 bg-white text-[9px] shadow-sm font-sans">ENTER ↵</kbd>
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