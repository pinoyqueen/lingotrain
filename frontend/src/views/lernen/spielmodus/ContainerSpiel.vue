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
// TODO: auch hier die Spiele für Satz

// --- Liste der Spiele (kannst du jederzeit erweitern) ---
const WORT_SPIELE = [MCQSpiel, PaareSpiel, TestSpiel]
// TODO: hier auch die Spiele für Satz


// --- State: aktive Komponente + Key zur Forcierung von Re-Render ---
const activeComponent = ref<any | null>(null)
const viewKey = ref(0) // erhöht sich bei Wechsel -> Komponente rendert neu
const show = ref(false)

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
  const spiel_pool = vok.isWort ? WORT_SPIELE : WORT_SPIELE

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
  show.value = false
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
  show.value = true
  vkStore.frageBeantwortet(result)
  if (result) {
    console.log("✔️ richtig")
  } else {
    console.log("❌ falsch")
  }
}


</script>

<template>
  <h2>Spiel Container</h2>
  <p v-if="isRundeFertig">Runde is fertig</p>
  <div v-else>
    <component v-if="activeComponent && aktuelleFrage" 
                :is="activeComponent" 
                :vokabel ="aktuelleFrage" 
                :key="viewKey"
                @answered="onAnswered"/>
    
  <div class="flex justify-end mt-4">
      <Button
        v-show="show"
        @click="next"
        class="bg-[var(--green)] hover:bg-green-700 text-white font-semibold px-4 py-2 rounded"
      >
        Next
      </Button>
  </div>

  </div>
  
</template>
