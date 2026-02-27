<script setup lang="ts">
import { Trophy, ArrowRight, LayoutDashboard } from 'lucide-vue-next';
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

/** Reaktiver State für die animierte Anzeige der Punkte am Ende einer Lernrunde */
const anzeigepunkte = ref(0)

// --- Reaktive Computed Properties ---
const aktuelleFrage = computed<Vokabeln | null>(() => vkStore.aktuelleFrage ?? null)
const isRundeFertig = computed<boolean>(() => vkStore.rundeFertig)
const progress = computed(() => {
  if (vkStore.startAnzahl === 0) return 0
  return Math.round(
    (vkStore.beantwortet / vkStore.startAnzahl) * 100
  )
})

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

/* 
 * Beobachtet, ob eine Runde fertig ist und berechnet ggf. dann die engültigen
 * Punkte der Runde und aktualisiert diese im Konto (dabei werden Basis-Punkte zur
 * Rundenbeendigung erhalten) und die Animation gestartet, um die Punkte per Animation
 * hochzählen zu lassen
 */
watch(isRundeFertig, async (fertig) => {
  if(!fertig) return;
  
  const punkte = punkteStore.rundeBeenden(true);
  
  if(punkte && punkte > 0) {
    await kontoStore.addPunkteZuKonto(punkte);

    // Startet die Animation mit den erhaltenen Punkten
    animatePunkte(punkte);
  }
})

// Beobachtet den Fortschritt der aktuellen Runde
watch(progress, val => emit('update:progress', val))

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
// function updateProgress() {
//   const value =  Math.round(((vkStore.index + 1) / vkStore.alleVokabeln.length) * 100)
//   emit('update:progress', value)
// }

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
  
  // updateProgress()
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
  // emit('update:progress', 0)
  punkteStore.resetRunde();
  kontoStore.punkteSchonGespeichert = false;
  activeComponent.value = null
  vkStore.resetRunde()
  // updateProgress()
  await vkStore.ladeVokabeln(lernsetId)
  chooseSpiel()
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

/**
 * Methode zum animierten Hochzählen der Punkte.
 * 
 * Diese Methode zählt die Punkte von 0 bis zu einem Endwert hoch und zeigt
 * dies animiert in der UI an. Dabei wird eine insgesamte Dauer von 1,5 Sekunden
 * verwendet und am Ende (kurz vor dem Endwert) wird die Animation etwas langsamer.
 * 
 * @param zielWert 
 */
function animatePunkte(zielWert: number) {
  anzeigepunkte.value = 0
  const dauer = 1500
  const startZeit = performance.now()

  const step = (jetzt: number) => {
    const progress = Math.min((jetzt - startZeit) / dauer, 1)

    // Gegen Ende langsamer werden
    const easeOut = 1 - Math.pow(1 - progress, 3)
    anzeigepunkte.value = Math.floor(easeOut * zielWert)

    if (progress < 1) {
      requestAnimationFrame(step)
    }
  }
  requestAnimationFrame(step)
}

</script>

<template>
  <!-- wenn Runde fertig ist --> 
  <div v-if="isRundeFertig" class="flex h-full w-full items-center justify-center bg-gradient-to-b from-background to-muted/30 p-6">
    
    <div class="mb-8 w-full max-w-md bg-card border shadow-2xl rounded-[2.5rem] p-8 text-center animate-in zoom-in fade-in duration-500 relative z-10">
      
      <div class="relative mx-auto w-24 h-24 flex items-center justify-center">
        <div class="absolute inset-0 bg-primary/20 rounded-full blur-2xl opacity-40"></div>
        <div class="relative bg-primary/10 text-primary w-20 h-20 rounded-full flex items-center justify-center shadow-inner border border-primary/20 overflow-hidden group">
          <Trophy :size="40" stroke-width="2.2" class="relative z-10" />
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shine"></div>
        </div>
      </div>

      <h2 class="text-3xl font-extrabold tracking-tight mb-2 text-foreground">
        Super gemacht!
      </h2>
      <p class="text-muted-foreground mb-8 font-medium">
        Du hast diese Runde erfolgreich beendet.
      </p>

      <div class="bg-secondary/30 border border-border rounded-3xl p-6 mb-10 relative overflow-hidden">
        <span class="block text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground mb-1 relative z-10">
          Erhaltene Punkte
        </span>
        <div class="text-6xl font-black text-primary tabular-nums tracking-tighter relative z-10">
          +{{ anzeigepunkte }}
        </div>
        <Trophy :size="100" class="absolute -right-6 -bottom-6 text-primary opacity-[0.04] -rotate-12" />
      </div>

      <div class="flex flex-col gap-3">
        <Button 
          @click="nextRunde" 
          class="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <span>Nächste Runde starten</span>
          <ArrowRight :size="20" stroke-width="3" />
        </Button>
        
        <Button 
          variant="ghost"
          @click="() => router.push(`/meinevokabeln/${route.params.id}/${route.params.slug}`)" 
          class="w-full h-12 text-muted-foreground hover:text-foreground font-semibold transition-all flex items-center justify-center gap-2"
        >
          <LayoutDashboard :size="18" />
          <span>Zurück zur Übersicht</span>
        </Button>
      </div>
    </div>
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