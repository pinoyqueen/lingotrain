<script setup lang="ts">
import { useVkStore } from '@/stores/vokabelKontoStore';
import { computed, defineAsyncComponent, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import Button from '@/components/ui/button/Button.vue';
import type { Vokabeln } from '@/models/Vokabeln';

const route = useRoute()
const vkStore = useVkStore()
const lernsetId = String(route.params.id)

const aktuelleFrage = computed<Vokabeln | null>(() => vkStore.aktuelleFrage ?? null)
const isRundeFertig = computed<boolean>(() => vkStore.rundeFertig)

// --- Komponenten: Lazy-loaded ---
const MCQSpiel = defineAsyncComponent(() => import('@/views/lernen/spielmodus/MCQSpiel.vue'))
const PaareSpiel = defineAsyncComponent(() => import('@/views/lernen/spielmodus/PaareSpiel.vue'))
const TestSpiel = defineAsyncComponent(() => import('@/views/lernen/spielmodus/TestSpiel.vue'))
const SchreibenSpiel = defineAsyncComponent(() => import('@/views/lernen/spielmodus/SchreibenSpiel.vue'))

const WORT_SPIELE = [MCQSpiel, PaareSpiel, TestSpiel, SchreibenSpiel]
const SATZ_SPIELE = [SchreibenSpiel]

// --- State: aktive Komponente + Key zur Forcierung von Re-Render ---
const activeComponent = ref<any | null>(null)
const viewKey = ref(0) // erhöht sich bei Wechsel -> Komponente rendert neu

// Feedback
const feedbackLoesung = ref('')
const feedbackRichtig = ref(false)
const showFeedback = ref(false)

// Button State
const buttonText = ref('Prüfen')
const currentSpielRef = ref<any>(null)

// --- Hilfsfunktion: zufällige Auswahl ---
function pickRandom<T>(arr: T[]): T {
  if (arr.length === 0) {
    throw new Error('pickRandom: Array ist leer')
  }
  const idx = Math.floor(Math.random() * arr.length)
  return arr[idx]!
}

function chooseSpiel() {
  if (!aktuelleFrage.value) return null

  const vok = aktuelleFrage.value

  // TODO: hier mit SATZ_SPIELE ersetzen
  const spiel_pool = vok.isWort ? WORT_SPIELE : SATZ_SPIELE

  return pickRandom(spiel_pool)
}

onMounted(async () => {
    vkStore.resetRunde()
    await vkStore.ladeVokabeln(lernsetId)
    
    if (vkStore.aktuelleFrage) {
      activeComponent.value = chooseSpiel()
      viewKey.value++
    } else {
      next()
    }

})

function next() {
  showFeedback.value = false
  buttonText.value = "Prüfen"
  feedbackLoesung.value = ''
  feedbackRichtig.value = false

  vkStore.nextFrage()
  console.log("aktuelle Frage: " + vkStore.aktuelleFrage?.vokabel)

  if(!vkStore.aktuelleFrage) {
    activeComponent.value = null
    return
  }

  // TODO: prüfen ob es genug Vokabeln für das Spiel gibt
  activeComponent.value = chooseSpiel()
  viewKey.value++ // zwingt neu rendering
}

function onAnswered(result: boolean) {
  feedbackRichtig.value = result
  feedbackLoesung.value = result ? '' : (aktuelleFrage.value?.vokabel || '')
  showFeedback.value = true

  vkStore.frageBeantwortet(result)
  if (result) {
    console.log("✔️ richtig")
  } else {
    console.log("❌ falsch")
  }

  buttonText.value = 'Next'
}

function buttonClicked() {
  if (!aktuelleFrage.value) return

  if (buttonText.value === 'Prüfen') {
    // Falls die Komponente eine manuelle Prüfen-Funktion hat (wie SchreibenSpiel)
    if (currentSpielRef.value?.pruefen) {
      const result = currentSpielRef.value.pruefen()
      onAnswered(result)
    }
  } else {
    next()
  }
}

// --- Styles ---
const footerStyle = computed(() => {
  if (!showFeedback.value) return { 
    backgroundColor: 'transparent', 
    borderColor: 'transparent',
    boxShadow: 'none' 
  }
  return {
    backgroundColor: feedbackRichtig.value ? 'var(--success)' : 'var(--warning)',
    borderColor: 'rgba(255,255,255,0.1)'
  }
})

const buttonClass = computed(() => {
  if (!showFeedback.value) return 'bg-primary hover:bg-primary/80'
  return 'bg-black/20 hover:bg-black/30 border border-white/20'
})
</script>

<template>
  <p v-if="isRundeFertig">Runde is fertig</p>

  <div v-else class="flex flex-col h-full w-full">
    <div class="flex-1 w-full overflow-y-auto p-6 sm:p-10">
      <component
        v-if="activeComponent && aktuelleFrage"
        :is="activeComponent"
        :vokabel="aktuelleFrage"
        :key="viewKey"
        ref="currentSpielRef"
        @answered="onAnswered" 
      />
    </div>

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
                  {{ feedbackRichtig ? 'Richtig!' : 'Lösung:' }}
                </h3>
                <p class="text-base leading-relaxed break-all opacity-95 font-medium">
                  {{ feedbackRichtig ? 'Hervorragende Arbeit.' : feedbackLoesung }}
                </p>
              </div>
            </div>
          </div>

          <div :class="!showFeedback ? 'w-full flex justify-end' : 'w-full sm:w-auto'">
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