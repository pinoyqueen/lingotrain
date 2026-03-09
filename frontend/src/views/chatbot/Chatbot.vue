<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue"
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
import { useLernsetStore } from "@/stores/lernsetStore"
import { useVokabelnStore } from "@/stores/vokabelnStore"
import { onBeforeRouteLeave } from "vue-router"


// --- Stores initialisieren ---
const vkStore = useVkStore()
const kontoStore = useKontoStore()
const lernsetStore = useLernsetStore()
const vokabelnStore = useVokabelnStore();

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
/** Modus des Chats (Einzelner Satz oder ganze Konversation möglich) */
const modus = ref<"satz" | "konversation" | null>(null);
/** Suchanfrage nach einem Lernset */
const searchQuery = ref("")
/** die ID des ausgewählten Lernsets, welches der Nutzer lernen möchte */
const selectedLernsetId = ref<string | null | undefined>(null)
/** Referenz auf das DOM-Element des Chat-Containers (zum automatischen Scrollen bei neuen Nachrichten) */
const chatContainer = ref<HTMLElement | null>(null)
/** Vokabeln für die Konversationsmodus (Sätze sind ausgeschlossen) */
const conversationVocabulary = ref<Vokabeln[]>([])
/** Der aktuelle Zustand der Konversation */
const conversationState = ref<any>(null)
/** Anzahl der gelernten Vokabeln pro Runde (insgesamt also richtig und falsch) */
const vokabelnDerRunde = ref(0);

// --- Computed Properties ---
/** ID des aktuellen Kontos */
const kontoId = computed(() => kontoStore.aktuellesKonto?.id);
/** aktuelle Lernsprache */
const aktuelleSprache = computed(() => kontoStore.aktuelleSprache);
/** aktuelle Vokabel */
const vokabel = computed<Vokabeln | null>(() => vkStore.aktuelleFrage ?? null)
/** Prüft, ob die Runde beendet ist */
const isRundeFertig = computed<boolean>(() => vkStore.rundeFertig)

/** 
 * Filtert die Lernsets.
 * Die Filterung basiert dabei auf der Suche, d.h. auf dem
 * Begriff, den der Nutzer in der Suche eingibt.
 */
const gefilterteLernsets = computed(() => {
  const sets = lernsetStore.sets; 
  
  if(!sets) return [];
  if(!searchQuery.value) return sets;

  return sets.filter(set => 
    set.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
})

/** Mapping für ISO-Code für den Evaluator */
const languageMap: Record<string,string> = {
  "Englisch": "en",
  "Deutsch": "de",
  "Französisch": "fr",
  "Spanisch": "es"
}

/** Beim Mount Vokabeln laden, Chatverlauf aus dem Session Storage wiederherstellen (falls vorhanden)*/
onMounted(async () => {
  const saved = sessionStorage.getItem("chatHistory")
  if (saved) {
    messages.value = JSON.parse(saved)
  }
})

/** beim Verlassen der Seite wird der Chat zurückgesetzt */
onBeforeRouteLeave(async (_to, _from, next) => {

  // Sitzung zurücksetzen und Navigation zu anderer Seite zulassen
  resetSession();
  next(); 
})

/**
 * Startet das Training nach der Auswahl vom Lernset und Modus.
 * Beim Start des Trainings wird die Runde zurückgesetzt und die Vokabeln des Lernsets
 * geladen sowie ein Satz dazu geladen / Konversation gestartet.
 */
async function startTraining(setId: string, gewaehlterModus: "satz" | "konversation") {
  selectedLernsetId.value = setId
  modus.value = gewaehlterModus
  
  loading.value = true
  
  if (modus.value === 'satz') {
    vkStore.resetRunde()
    await vkStore.ladeVokabeln(setId)
    await loadSentence()
  } else {
    await vokabelnStore.loadByLernsetId(setId)
    // im Konversationsmodus sollen nur Wörter als Vokabeln geladen werden, damit Sätze ausgeschlossen sind
    if (vokabelnStore.liste.length === 0) {
      saveMessage("assistant", "Keine Vokabeln in diesem Lernset gefunden. Bitte wähle ein anderes Lernset aus.", "feedback")
      loading.value = false
      return
    }
    conversationVocabulary.value = vokabelnStore.liste.filter(v => v.isWort)
    saveMessage("assistant", "Hallo! Lass uns eine Unterhaltung beginnen. Ich fange an...", "feedback")
    await startConversation()
  }

  loading.value = false
}

/** Chatverlauf bei jeder Änderung im Session Storage persistieren */
watch(messages, (newVal) => {
  sessionStorage.setItem("chatHistory", JSON.stringify(newVal))
}, { deep: true })

/**
 * Startet ene neue Konversation mit Fokus auf eine zufällige Vokabel.
 * 
 * Prüft zunächst ob noch Vokabeln vorhanden sind. Wenn nicht, gibt Feedback und bricht ab.
 * Wählt zufällig eine Vokabel aus der Vokabelnliste aus.
 * Sendet die Vokabel, die Zielsprache und die Übersetzung an das Backend, um die Konversation zu starten.
 * Speichert den Konversationszustand und zeigt die erste Bot-Nachricht an.
 * Entfernt die verwendete Vokabel aus der Liste, damir sie nicht erneut verwendet wird.
 */
async function startConversation() {
  if (conversationVocabulary.value.length === 0) {
    saveMessage("assistant", "Keine Wörter für die Konversation gefunden.", "feedback")
    return
  }

  // Zufälliges Fokusobjekt wählen
  const random = conversationVocabulary.value[Math.floor(Math.random() * conversationVocabulary.value.length)]

  if (!random) {
    saveMessage("assistant", "Keine weiteren Wörter für die Konversation gefunden.", "feedback")
    return
  }
  
  const res = await fetch("http://localhost:8000/conversation/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      target_word: random.vokabel,
      target_language: languageMap[aktuelleSprache.value?.sprache || "Deutsch"],
      translation: random.uebersetzung
    })
  })

  const data = await res.json()
  conversationState.value = data
  console.log("Konversation gestartet mit Fokus auf: " + random.vokabel)
  // Nur Assistant anzeigen, system-nachricht ignorieren
  const firstAssistantMessage = data.messages.find((m: any) => m.role === "assistant")

  saveMessage("assistant", firstAssistantMessage.content, "sentence")

  // verwendeten Vokabel aus der Liste entfernen, damit er nicht nochmal in der Konversation auftaucht
  conversationVocabulary.value = conversationVocabulary.value.filter(v => v.vokabel !== random.vokabel)
}

/**
 * Lädt einen Satz für die aktuelle Vokabel.
 * 
 * Prüft zunächst, ob die Runde abgeschlossen ist und setzt sie ggf. zurück.
 * Springt über alle Vokablen, die Sätze sind, bis ein Wort gefunden wird.
 * Ruft das Backend über /generate-sentence auf, um ein Satz zu generieren.
 * Bereitet die Vokabel für die erste Eingabe vor.
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

  // wenn Vokabel ein Satz ist, einfach ausgeben
  if (!vokabel.value?.isWort) {
    sentence.value = "Übersetzen Sie diesen Satz: " +  vokabel.value?.uebersetzung
  } else {
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
  }

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
  if (modus.value === "konversation") {
    await sendConversationMessage()
    return
  }
  if (!vokabel.value || !userInput.value) return
  loading.value = true

  // Benutereingabe in Chatverlauf speichern
  saveMessage("user", userInput.value, "answer")

  let res

  if(!vokabel.value.isWort) {
    res = await fetch("http://localhost:8000/evaluate-sentence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_answer: userInput.value,
        original_sentence: vokabel.value.vokabel,
        target_word: vokabel.value.vokabel,
        target_language: languageMap[aktuelleSprache.value?.sprache]
      })
    })

  } else {
    res = await fetch("http://localhost:8000/evaluate-answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        user_answer: userInput.value,
        original_sentence: sentence.value,
        target_word: vokabel.value.vokabel,
        target_language: languageMap[aktuelleSprache.value?.sprache]
      })
    })
  }
  const data = await res.json()

  // erster Versuch entscheidet über den Status der Vokabel, der in der DB gesetzt werden soll
  // da der Nutzer ansonsten Hinweise hatte und es nicht alleine richtig hatte
  if(firstAttempt.value) {
    vkStore.frageBeantwortet(data.correct);
  } 

  // Im normalen Satzmodus wird nach dem ersten Versuch die Anzahl gelernter Vokabeln erhöht (egal ob richtig oder falsch, aber es wurde versucht)
  if(firstAttempt.value && modus.value === "satz") {
    vokabelnDerRunde.value++;
  }
  
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
      await nextVokabel()
  }

  loading.value = false
}

/**
 * Sendet die Benutzereingabe an das Backend, um die Konversation fortzusetzen.
 * 
 * Speichert die Benutzereingabe im Chatverlauf.
 * Sendet die aktuelle Konversation, Benutzereingabe und Zielsprach an das Backend.
 * Aktualisiert den Konversationszustand mit der Antwort vom Backend und speichert die Antwort
 * des Bots im Chatverlauf.
 * 
 * Wenn die Konversation abgeschlossen ist, wird zunächst ein Feedback zur Konversation gegeben und
 * dann automatisch eine neue Konversation mit der nächsten Vokabel gestartet.
 */
async function sendConversationMessage() {
  if (!conversationState.value || !userInput.value) {
    console.log("Fehler: Kein Konversationszustand oder keine Benutzereingabe vorhanden.")
    return
  }
  loading.value = true

  // Benutzereingabe im Chatverlauf speichern
  saveMessage("user", userInput.value, "answer")

  const res = await fetch("http://localhost:8000/conversation/next", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      state: conversationState.value,
      user_input: userInput.value,
      target_language: languageMap[aktuelleSprache.value?.sprache]
    })
  })

  const data = await res.json()
  conversationState.value = data.state

  // Antwort des Bots prüfen, ob es ein Feedback-Objekt ist
  if (typeof data.reply === "object" && data.reply.feedback) {

    // Feedback wie bei normalem Satzmodus speichern (damit es in der UI gleich angezeigt werden kann)
    saveMessage("assistant", data.reply.feedback, "feedback", {
      suggestion: data.reply.suggestion,
      rating: data.reply.rating,
      comment: data.reply.comment
    })

    // die UI-Variablen aktualisieren
    feedback.value = data.reply.feedback
    comment.value = data.reply.comment
    suggestion.value = data.reply.suggestion
    rating.value = data.reply.rating

  } else {
    // normale Bot-Nachricht
    saveMessage("assistant", data.reply, "sentence")
  }

  userInput.value = ""
  loading.value = false

  // Wenn Konversation abgeschlossen, neue starten
  if (data.finished) {
    startConversation()
  }
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

/**
 * Scrollt den Chat-Container automatisch nach unten.
 * Dabei wird nextTick() verwendet, um sicherzustellen, dass das DOM bereits
 * mit den neuesten Nachrichten aktualisiert wurde, bevor die Höhe berechnet wird,
 * um die gescrollt werden muss.
 */
const scrollToBottom = async () => {
  // warten, bis das DOM nach einer State-Änderung gerendert wurde
  await nextTick()

  if (chatContainer.value) {
    chatContainer.value.scrollTo({
      top: chatContainer.value.scrollHeight,
      behavior: 'smooth'
    })
  }
}

// Beobachtet die Nachrichten und den Ladezustand für automatisches Scrollen
watch([messages, loading], () => {
  scrollToBottom()
}, { deep: true })

/**
 * Zurücksetzen der aktuellen Session.
 */
async function resetSession() {

  // gelernte Vokabeln pro Tag speichern (Tagesstatistik) und danach die lokale Variable zurücksetzen
  if(vokabelnDerRunde.value > 0) {
    await kontoStore.updateVokabelnHeute(vokabelnDerRunde.value);
  }
  vokabelnDerRunde.value = 0;
  
  // Chat-Historie leeren
  messages.value = []

  // SessionStorage löschen
  sessionStorage.removeItem("chatHistory")

  // Modus und ausgewähltes Lernset zurücksetzen
  modus.value = null;
  selectedLernsetId.value = null;

  // UI-State zurücksetzen
  sentence.value = ""
  userInput.value = ""
  feedback.value = ""
  comment.value = ""
  suggestion.value = ""
  rating.value = ""
  firstAttempt.value = true
}

</script>

<template>
  <div class="w-full h-[calc(100vh-60px)] flex flex-col p-2 md:p-3 pb-1 gap-2 bg-[var(--color-surface)] overflow-hidden">
    
    <!-- Header mit Titel, Icon und Reset-Button -->
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

    <!-- Hauptbereich (Auswahl-Ansicht oder Chat) -->
    <div class="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-950 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-[var(--color-secondary-variant)]/40 overflow-hidden">
      
      <!-- Startansicht, wenn noch kein Modus ausgewählt ist -->
      <div v-if="!modus" class="flex-1 flex flex-col min-h-0 animate-in fade-in duration-500">
        <div class="p-6 pb-2 text-center space-y-2 shrink-0">
          <h2 class="text-2xl font-black text-zinc-800 dark:text-zinc-100">Was möchtest du üben?</h2>
          <p class="text-sm text-muted-foreground">Wähle ein Thema und leg direkt los.</p>
        </div>

        <!-- Suchfeld für Lernsets -->
        <div class="px-6 mb-4 max-w-2xl mx-auto w-full shrink-0">
          <Input 
            v-model="searchQuery" 
            placeholder="Lernset suchen..." 
            class="h-10 rounded-xl focus-visible:ring-[var(--primary)]/80"
          />
        </div>

        <!-- Liste der Lernsets -->
        <div class="flex-1 overflow-y-auto px-6 custom-scrollbar">
          <div class="grid w-full max-w-2xl mx-auto grid-cols-1 sm:grid-cols-2 gap-3 pb-6">
            <button 
              v-for="set in gefilterteLernsets" 
              :key="set.id"
              @click="selectedLernsetId = set.id"
              :class="[
                'p-4 rounded-xl border-2 text-left transition-all duration-300 group flex items-center justify-between',
                selectedLernsetId === set.id 
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-md' 
                  : 'border-zinc-100 hover:border-zinc-200 bg-zinc-50/50'
              ]"
            >
              <span :class="['font-bold truncate pr-2', selectedLernsetId === set.id ? 'text-[var(--color-primary)]' : 'text-zinc-600']">
                {{ set.name }}
              </span>
              <CheckCircle2 v-if="selectedLernsetId === set.id" :size="18" class="text-[var(--color-primary)] shrink-0" />
            </button>
          </div>
        </div>

        <!-- Auswahl des Trainingsmodus -->
        <div v-if="selectedLernsetId" class="p-6 bg-white/80 backdrop-blur-md border-t border-zinc-100 animate-in slide-in-from-bottom-4 shrink-0">
          <div class="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <!-- Button für Training mit einem Satz -->
            <button @click="startTraining(selectedLernsetId, 'satz')" 
              class="flex items-center gap-4 p-5 rounded-2xl bg-white border border-zinc-200 hover:border-[var(--color-primary)] hover:shadow-xl transition-all">
              <MessageSquareText class="text-[var(--color-primary)]" :size="28" />
              <div class="text-left">
                <span class="block font-black text-zinc-800">Satz bilden</span>
                <span class="text-[9px] text-muted-foreground uppercase font-bold">Fokus auf Übersetzung</span>
              </div>
            </button>

            <!-- Button für Konversationsmodus -->
            <button @click="startTraining(selectedLernsetId, 'konversation')" 
              class="flex items-center gap-4 p-5 rounded-2xl bg-white border border-zinc-200 hover:border-[var(--color-secondary)] hover:shadow-xl transition-all">
              <Bot class="text-[var(--color-secondary)]" :size="28" />
              <div class="text-left">
                <span class="block font-black text-zinc-800">Konversation</span>
                <span class="text-[9px] text-muted-foreground uppercase font-bold">Freies Sprechen</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Chat -->
      <template v-else>

        <!-- Chatverlauf -->
        <div ref="chatContainer" class="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 pb-12 custom-scrollbar [background-size:20px_20px] dark:bg-none">
          <div v-if="messages.length === 0" class="h-full flex items-center justify-center">
             <div class="animate-pulse flex items-center gap-2 text-muted-foreground">
               <Bot :size="20" class="animate-bounce" /> Lade Training...
             </div>
          </div>

          <!-- Einzelne Chatnachricht -->
          <div v-for="(msg, index) in messages" :key="index"
               :class="['flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300', msg.role === 'user' ? 'justify-end' : 'justify-start']">
            <div :class="[
              'max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm md:text-base shadow-sm border transition-all border-transparent rounded-tr-none',
              msg.role === 'user' 
                ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]' 
                : 'bg-[var(--color-secondary)]/90 text-[var(--color-secondary-foreground)]'
            ]">

              <!-- Aufgabentyp -->
              <div v-if="msg.type === 'sentence'" class="flex items-center gap-1 text-[9px] font-black opacity-50 uppercase mb-1 tracking-wider">
                <MessageSquareText :size="12" /> Aufgabe
              </div>

              <!-- Nachrichtentext -->
              <p class="font-medium leading-relaxed">{{ msg.content }}</p>

              <!-- Feedback-Text -->
              <div v-if="msg.type === 'feedback' && msg.details" class="mt-3 pt-3 border-t border-black/5 space-y-3">
                
                <!-- Verbesserungsvorschlag -->
                <p v-if="msg.details.suggestion" class="text-xs bg-white/50 p-2.5 rounded-lg italic border border-black/5 flex items-start gap-2 shadow-inner">
                  <Info :size="14" class="mt-0.5 shrink-0 text-[var(--color-primary)]" /> 
                  <span class="opacity-90 leading-normal">{{ msg.details.suggestion }}</span>
                </p>

                <!-- Bewertung und Kommentar -->
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

          <!-- Anzeige, dass der Bot am schreiben ist -->
          <div v-if="loading" class="flex justify-start pb-4 animate-in fade-in duration-300">
            <div class="bg-[var(--color-secondary)]/50 text-[var(--color-secondary-foreground)] rounded-2xl px-4 py-2 flex items-center gap-2 shadow-sm rounded-tr-none">
              <div class="flex gap-1">
                <span class="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span class="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span class="w-1.5 h-1.5 bg-current rounded-full animate-bounce"></span>
              </div>
              <span class="text-[10px] font-black uppercase tracking-wider opacity-70">Lingotrain schreibt...</span>
            </div>
          </div>

          <div class="h-2"></div>
        </div>

        <!-- Eingabebereich für den Nutzer -->
        <div class="p-3 bg-zinc-50/90 dark:bg-zinc-900/90 backdrop-blur-md border-t border-[var(--color-secondary-variant)]/30 shrink-0">
          <div class="w-full flex flex-col gap-2">
            
            <!-- Eingabefeld und Prüf-Button -->
            <div class="relative flex items-center">
              <Input 
                v-model="userInput"
                @keyup.enter="checkAnswer"
                :disabled="loading || (modus === 'satz' && vkStore.rundeFertig)"
                placeholder="Antwort tippen..."
                class="h-12 text-sm pl-4 pr-32 rounded-xl border-2 focus-visible:ring-[var(--primary)]/60 shadow-sm transition-all"
              />
              <Button 
                variant="primary"
                @click="checkAnswer" 
                :disabled="loading || !userInput || (modus === 'satz' && vkStore.rundeFertig)"
                class="absolute right-1.5 h-9 px-4 text-xs rounded-lg shadow-md font-bold"
              > 
                Überprüfen
              </Button>
            </div>
            
            <!-- Button für das Laden einer neuen Vokabel und Hinweise zum Ende einer Runde / Senden einer Eingabe -->
            <div class="flex justify-between items-center h-6 px-1">
              <div class="flex items-center">
                <Button 
                  variant="ghost"
                  v-if="!vkStore.rundeFertig && messages.length > 0 && modus === 'satz'"
                  @click="loadSentence" 
                  class="text-[11px] font-black text-[var(--color-primary)] flex items-center gap-1.5 hover:gap-2.5 hover:text-[var(--color-primary)] transition-all uppercase tracking-tight h-auto p-0 bg-transparent"
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
      </template>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
</style>