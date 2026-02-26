<script setup lang="ts">
import { useVkStore } from '@/stores/vokabelKontoStore';
import { computed, defineAsyncComponent, onMounted, ref, shallowRef, watch } from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import Button from '@/components/ui/button/Button.vue';
import type { Vokabeln } from '@/models/Vokabeln';
import { useVokabelnStore } from '@/stores/vokabelnStore';
import { usePunkteStore } from '@/stores/punkteStore';
import { useKontoStore } from '@/stores/kontoStore';

/** Maximale Anzahl, nach der MCQ nicht mehr ausgewählt wird */
const MAX_GELERNT = 4

// --- Route und Store Setup
const route = useRoute()
const router = useRouter()
const vkStore = useVkStore()
const vokabelnStore = useVokabelnStore()
const punkteStore = usePunkteStore()
const kontoStore = useKontoStore()
const lernsetId = String(route.params.id)
const choosing = ref(false)
const spielLoading = ref(true)

// --- Reaktive Computed Properties ---
const aktuelleFrage = computed<Vokabeln | null>(() => vkStore.aktuelleFrage ?? null)
const isRundeFertig = computed<boolean>(() => vkStore.rundeFertig)

// --- Lazy-loaded Spielkomponenten ---
const MCQSpiel = defineAsyncComponent(() => import('@/views/lernen/spielmodus/MCQSpiel.vue'))
const PaareSpiel = defineAsyncComponent(() => import('@/views/lernen/spielmodus/PaareSpiel.vue'))
const SchreibenSpiel = defineAsyncComponent(() => import('@/views/lernen/spielmodus/SchreibenSpiel.vue'))
const LueckeSchreibenSpiel = defineAsyncComponent(() => import('@/views/lernen/spielmodus/LueckeSchreibenSpiel.vue'))
const BausteineSpiel = defineAsyncComponent(() => import('@/views/lernen/spielmodus/BausteineSpiel.vue'))

// --- Spiel-Pools für Wörter und Sätze ---
const WORT_SPIELE = [
  { key: 'mcq', comp: MCQSpiel },
  { key: 'paare', comp: PaareSpiel },
  { key: 'schreiben', comp: SchreibenSpiel }
]

const SATZ_SPIELE = [
  { key: 'schreiben', comp: SchreibenSpiel },
  { key: 'lueckeschreiben', comp: LueckeSchreibenSpiel },
  { key: 'bausteine', comp: BausteineSpiel }
]

// --- State: aktive Kind-Komponente ---
const activeComponent = shallowRef<any | null>(null)
const currentSpielRef = ref<any>(null)

// --- Feedback und UI State
const feedbackLoesung = ref('')
const feedbackRichtig = ref(false)
const showFeedback = ref(false)
const buttonText = ref('Prüfen')

/** Event-Emitter für Fortschritt */
const emit = defineEmits<{
  (e: 'update:progress', value: number): void
}>()

// Beobachtet, ob eine Runde fertig ist und berechnet ggf. dann die endgültigen
// Punkte der Runde und aktualisiert diese im Konto (dabei werden Basis-Punkte zur 
// Rundenbeendigung erhalten)
watch(isRundeFertig, async (fertig) => {
  if(!fertig) return;
  
  const punkte = punkteStore.rundeBeenden(true);
  
  if(punkte && punkte > 0) {
    await kontoStore.addPunkteZuKonto(punkte);
  }
})

// Wenn die Seite verlassen wird, werden die endgültigen
// Punkte der Runde berechnet und im Konto aktualisiert
onBeforeRouteLeave(async () => {
  const punkte = punkteStore.rundeBeenden(false);

  if(punkte && punkte > 0) {
    await kontoStore.addPunkteZuKonto(punkte);
  }
})

/** Beim Mount die Vokabeln laden und erste Frage auswählen */
onMounted(async () => {
    punkteStore.resetRunde();
    kontoStore.punkteSchonGespeichert = false;

    vkStore.resetRunde()

    await vokabelnStore.loadByLernsetId(lernsetId)
    await vkStore.ladeVokabeln(lernsetId)
    
    if (vkStore.aktuelleFrage) {
      await chooseSpiel()
    } else {
      next()
    }
})

/**
 * Zufälliges Element aus einem Array wählen
 * @param arr Array
 */
function pickRandom<T>(arr: T[]): T {
  if (arr.length === 0) {
    throw new Error('pickRandom: Array ist leer')
  }
  const idx = Math.floor(Math.random() * arr.length)
  return arr[idx]!
}

/**
 * Berechnet den Fortschritt in Prozent und sendet an Parent via emit.
 */
function updateProgress() {
  const value =  Math.round(((vkStore.index + 1) / vkStore.alleVokabeln.length) * 100)
  emit('update:progress', value)
}

/**
 * Wählt den Spielmodus für die aktuelle Frage aus.
 * 
 * Die Auswahl häng davon an, ob es sich um ein Wort oder einen Satz handelt.
 * Zusätzlich wird geprüft, wie oft die Vokabel bereits richtig gelernt wurde.
 * Wenn die maximale Lernzahl erreiccht wurde (Standardwert: 4), werden einfachere Spieltypen deaktiviert.
 */
async function chooseSpiel() {
  console.log("chooseSpiel startet mit: " + activeComponent.value)
  if (choosing.value || !aktuelleFrage.value) return
  choosing.value = true
  try {
    const vok = aktuelleFrage.value

    // Wenn ein Satz nicht lang genug ist, wird nur der normale Schreiben-Modus verwendet und
    // nicht zufällig ausgewählt, weil andere Modi dann nicht viel bringen (Lücken füllen etc.)
    if (!vok.isWort && !isSentenceLongEnough(vok)) {
      activeComponent.value = SchreibenSpiel;
      return;
    }

    const frageId = vok.id

    let gelernt = 0
    if (frageId) {
      // Anzahl gelernt für diese Vokabel abfragen
      gelernt = await vkStore.getAnzahlGelernt(frageId)
      console.log(vok.id + " wird " + gelernt + " mal gelernt")
    } else
      console.log("frageId null")

  
    let spiel_pool = vok.isWort ? [...WORT_SPIELE] : [...SATZ_SPIELE]

    // prüfen ob es genug Vokabeln für das Spiel gibt
    const wortCount = vkStore.alleVokabeln
      .slice(vkStore.index)
      .filter(v => v?.isWort)
      .length

    if(wortCount < 3)
      spiel_pool = spiel_pool.filter(s => s.key !== 'paare')
    
    if(vkStore.alleVokabeln.length < 3)
      spiel_pool = spiel_pool.filter(s => s.key !== 'mcq')

    // MCQSpiel entfernen, falls schon oft gelernt
    if (vok.isWort && gelernt >= MAX_GELERNT) {
      spiel_pool = spiel_pool.filter(s => s.key !== 'mcq')
    }
    // TODO: einfacher Spieltyp für Sätze entfernen

    // Fallback wenn spiel_pool leer ist
    if(spiel_pool.length === 0 && vok.isWort) {
      const fallback = WORT_SPIELE.find(s => s.key === 'schreiben')
      if (fallback) spiel_pool = [fallback]
    }
    const chosen = pickRandom(spiel_pool)
    activeComponent.value = chosen.comp

    console.log("chooseSpiel endet mit: " + chosen.key)
  } finally {
    choosing.value = false
    spielLoading.value = false
  }
}

/**
  * Prüfen, ob ein Satz lang genug für alle Modi ist oder sich nur der Schreiben-Modus eignet.
  * 
  * Die Methode prüft, ob ein Satz mehr als 3 Wörter besitzt. Dabei wird der Satz von führenden
  * und nachfolgenden Leerzeichen entfernt und in seine einzelnen Wörter zerteilt.
  *
  * @param vokabel die Vokabel (der Satz)
  * @return True, wenn der Satz lang genug ist
  */
function isSentenceLongEnough(vokabel: Vokabeln): boolean {
  const satz = vokabel.vokabel
  if (!satz) return false

  return (satz.trim().split(/\s+/).length > 3)
}

/**
 * Schaltet zur nächsten Frage weiter.
 * 
 * Hier wird zur nächsten Frage weiter geschaltetet und dabei die UI
 * zurückgesetzt bzw. aktualisiert.
 * Der Next-Button wird dabei auch zunächst wieder in den "Prüfen"-Button
 * umgewandelt.
 */
async function next() {
  showFeedback.value = false
  buttonText.value = "Prüfen"
  feedbackLoesung.value = ''
  feedbackRichtig.value = false
  activeComponent.value = null
  spielLoading.value = true
  
  updateProgress()
  vkStore.nextFrage()

  if(!vkStore.aktuelleFrage) {
    activeComponent.value = null
    return
  }

  await chooseSpiel()
}

/**
 * Wird aufgerufen, wenn die Frage beantwortet wurde.
 * 
 * Diese Funktion wird z.B. nach einem Button-Klick aufgerufen, der signalisiert,
 * dass die Frage beantwortet wurde. 
 * Es wird entsprechend ein Feedback über richtig oder falsch und ggf. die Lösung
 * bzw. Übersetzung dazu angezeigt.
 * Außerdem werden die Punkte und der Streak bei richtiger Antwort erhöht bzw. der
 * Streak bei falscher Antwort zurückgesetzt.
 * 
 * Der Button wird dann in den Next-Button umgewandelt.
 * 
 * @param result True, wenn die Frage richtig beantwortet wurde
 */
function onAnswered(result: boolean) {
  feedbackRichtig.value = result;

  // Punkte bei richtiger Antwort erhöhen und Streak erhöhen oder zurücksetzen
  const streakEvent = punkteStore.frageBeantwortet(
    result,
    aktuelleFrage.value!.isWort
  );

  if(streakEvent > 0) {
    // TODO: 5er/10er-Streak anzeigen
  }

  if(!result) {
    const spiel = currentSpielRef.value;

    // je nach zurückgegebener Lösung, diese anzeigen; wird keine vom Modus zurückgegeben, dann auch nichts ausgeben
    if(spiel?.feedbackLoesung) {
      feedbackLoesung.value = spiel.feedbackLoesung();
    } else {
      feedbackLoesung.value = '';
    }
  }

  showFeedback.value = true

  vkStore.frageBeantwortet(result)

  buttonText.value = 'Next'
}

/**
 * Starte einer neuen Runde.
 */
async function nextRunde() {
  punkteStore.resetRunde();
  kontoStore.punkteSchonGespeichert = false;
  activeComponent.value = null
  vkStore.resetRunde()
  await vkStore.ladeVokabeln(lernsetId)
  chooseSpiel()
  updateProgress()
}

/**
 * Click-Handler für den Next-/Prüfen-Button.
 * 
 * Diese Funktion prüft, ob der Button aktuell im "Prüfen"-Modus
 * ist. Falls ja und der aktuelle Modus verfügt über eine Methode
 * pruefen(), dann wird die Antwort bei Button-Klick validiert. 
 * 
 * Ansonsten handelt es sich um den "Next"-Modus und es wird entsprechend
 * die Funktion {@link #next} aufgerufen und zur nächsten Frage navigiert.
 */
function buttonClicked() {
  if (!aktuelleFrage.value) return

  if (buttonText.value === 'Prüfen') {

    // Falls die Komponente eine manuelle Prüfen-Funktion hat
    if (currentSpielRef.value?.pruefen) {
      const result = currentSpielRef.value.pruefen()

      // bei Paaren gibt es pro richtigem Paar einen Punkt (+1 Punkt später wenn alles richtig war)
      if(result?.richtigePaare && result.richtigePaare > 0) {
        punkteStore.addPunkte(result.richtigePaare);
      }

      onAnswered(result.richtig)
    }
  } else {
    next()
  }
}

/**
 * Dynamische Berechnung des Stylings für den Footer.
 * 
 * Hier wird je nach Status das Layout für den Footer dynamisch gesetzt.
 * Zunächst ist der Footer unsichtbar, aber sobald eine Antwort des Nutzers
 * überprüft wird und in den Feedbackmodus geschaltet wird, erhält der Footer
 * ein passendes Styling mit Hintergrundfarbe (Grün bei Erfolg, rot bei Fehler) 
 * sowie einen Schatten.
 */
const footerStyle = computed(() => {
  if (!showFeedback.value) return { 
    backgroundColor: 'transparent', 
    borderColor: 'transparent',
    boxShadow: 'none' 
  }
  return {
    backgroundColor: feedbackRichtig.value ? 'var(--success)' : 'var(--warning)'
  }
})

/**
 * Setzt den Titel des Feedback.
 * 
 * Bei richtigen Antworten wird hier immer "Richtig" ausgegeben.
 * Bei falschen Antworten hingegen kann zwischen Lösung und 
 * spezialisierten Überschriften (z.B. Übersetzung) unterschieden werden.
 */
const feedbackTitle = computed(() => {
  if (feedbackRichtig.value) return 'Richtig!'

  // Spiel darf Titel überschreiben
  return currentSpielRef.value?.feedbackTitle ?? 'Lösung:'
})

/**
 * Berechnet die CSS-Klassen für den Prüfen-/Next-Button.
 * 
 * Da der Button von Prüfen zu Next und wieder zu Prüfen wechselt, wird
 * je nach Zustand das Design angepasst. Im Prüfen-Zustand erhält er die
 * primary-Farbe passend zum allgemeinen Design. Im Next-Zustand hingegen,
 * wird er an den Footer-Style je nach Erfolg / Fehler angepasst.
 */
const buttonClass = computed(() => {
  if (!showFeedback.value) return 'bg-primary hover:bg-primary/80'
  return 'bg-black/20 hover:bg-black/30 border border-white/20'
})
</script>

<template>
  <!-- wenn Runde fertig ist --> <!-- TODO: erzielte Punkte in der Runde anzeigen-->
  <div v-if="isRundeFertig" class="flex h-full w-full flex-col items-center justify-center text-center space-y-4">
    <p class="font-black text-foreground tracking-tight leading-tight mx-auto text-2xl sm:text-4xl max-w-3xl">Runde geschafft - weiter geht's!</p>
    <Button @click="nextRunde" class="mt-2 bg-[var(--success)] text-white">Runde starten</Button>
    <Button @click="() => router.push(`/meinevokabeln/${route.params.id}/${route.params.slug}`)"  class="bg-[var(--warning)] text-white">Zurück zur Vokabeln</Button>
  </div>

  <div v-else class="flex flex-col h-full w-full overflow-y-auto custom-scrollbar p-6">

    <!-- Kind-Komponenten Container -->
    <div class="flex-1 w-full overflow-y-auto custom-scrollbar p-6 sm:p-10 flex flex-col justify-center">
      
      <div class="w-full max-w-2xl mx-auto animate-in fade-in zoom-in duration-300">
        <component
          v-if="activeComponent && aktuelleFrage"
          :is="activeComponent"
          :vokabel="aktuelleFrage"
          :key="aktuelleFrage.id"
          ref="currentSpielRef"
          @answered="onAnswered" 
        />
      </div>
      
    </div>

    <!-- Feedback und Prüfen/Next Button Container -->
    <div class="w-full p-4 sm:p-6 shrink-0 mt-auto">
      <footer 
        class="transition-all duration-300 py-6 px-6 sm:px-10 rounded-2xl shadow-lg border"
        :style="footerStyle"
      >
        <div class="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          
          <div class="flex-1 w-full min-w-0">
            <div v-if="showFeedback" class="flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2">
              <div 
                class="hidden md:flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-sm"
                :class="feedbackRichtig ? 'bg-white text-[var(--success)]' : 'bg-white text-[var(--warning)]'"
              >
                <span class="text-2xl font-bold">{{ feedbackRichtig ? '✓' : '✕' }}</span>
              </div>

              <div class="flex flex-col min-w-0 text-white">
                <h3 class="text-lg font-bold mb-1 leading-none">
                  {{ feedbackRichtig ? 'Richtig!' : 'Leider falsch!' }}
                </h3>
                <p class="text-base leading-relaxed break-all opacity-95 font-medium">
                  {{ feedbackRichtig ? 'Hervorragende Arbeit.' : (feedbackTitle + ' ' + feedbackLoesung) }}
                </p>
              </div>
            </div>
          </div>

          <div v-if="!spielLoading" :class="!showFeedback ? 'w-full flex justify-end' : 'w-full sm:w-auto'">
            <Button
              @click="buttonClicked"
              class="w-full sm:w-auto px-12 h-12 rounded-xl font-bold text-white transition-all active:scale-95 shadow-md shrink-0"
              :class="buttonClass"
            >
              {{ buttonText }}
            </Button>
          </div>
        </div>
      </footer>
    </div>

  </div>
</template>

<style scoped>
/* Die Scrollbar soll nur im Kind-Teil sichtbar sein, wenn wirklich gescrollt wird */
.custom-scrollbar {
  scrollbar-gutter: stable; 
  scrollbar-width: thin;    
  scrollbar-color: #cbd5e1 transparent;
}

/* Chrome, Edge, Safari */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

/* Kein Hintergrund, damit sie nicht mitten drin aussieht */
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent; 
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 20px;
  border: 2px solid transparent;
  background-clip: content-box;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #94a3b8;
  background-clip: content-box;
}
</style>