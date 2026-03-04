<script setup lang="ts">
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Vokabeln } from '@/models/Vokabeln'
import { useKontoStore } from '@/stores/kontoStore'
import { useVokabelnStore } from '@/stores/vokabelnStore'
import { ArrowLeftIcon, ArrowRightIcon, RefreshCcwIcon, RotateCcwIcon, ShuffleIcon } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'

// --- Stores und Route ---
const vokabelnStore = useVokabelnStore()
const kontoStore = useKontoStore()
const route = useRoute()
const lernsetId = String(route.params.id)

// --- Card State ---
/** Karte aktuell gedreht? */
const isFlipped = ref(false) 
/** Shuffle-Modus aktiv? */
const shuffleActive = ref(false)
/** Anzeige-Reihenfolge (Default: Vokabel zuerst) */
const vokabelVorne = ref(true)

// --- Aktuelle Karte und Liste ---
/** aktuelle Vokabel */
const curr = ref<Vokabeln>() 
/** originale Liste (für Shuffle verwendet) */
const originalList = ref<Vokabeln[]>([])
/** Index der aktuellen Vokabel */
const currIndex = ref(0) 
/** Anzahl gesamten Vokabeln (für Progressbar verwendet) */
const totalCards = ref(0)

/** gelernten Vokabeln in der Runde (insgesamt also richtig und falsch) */
const gelernteIds = ref(new Set<string>());

/** Karte umdrehen */
const flipCard = () => {
  isFlipped.value = !isFlipped.value
}

/** Event-Emitter für Fortschritt */
const emit = defineEmits<{
  (e: 'update:progress', value: number): void
}>()

/** Laden der Vokabeln beim Mount */
onMounted(async () => {
    await vokabelnStore.loadByLernsetId(lernsetId)
    originalList.value = [...vokabelnStore.liste] // Original sichern
    totalCards.value = vokabelnStore.liste.length
    updateCard() // erste Karte setzen
    kontoStore.updateFlamme() // Flamme prüfen und aktualisieren
});

// Wenn die Seite verlassen wird, wird die Anzahl der gelernten Vokabeln 
// pro Tag (für die Tagesstatistik) aktualisiert
onBeforeRouteLeave(async () => {

    const vokabelnDerRunde = gelernteIds.value.size;
    if(vokabelnDerRunde > 0) {
        await kontoStore.updateVokabelnHeute(vokabelnDerRunde);
    }
})

/**
 * Setzt die aktuelle Karte und berechnet Fortschritt.
 */
function updateCard() {
    curr.value = vokabelnStore.liste[currIndex.value]
    isFlipped.value = false // Karte zurückdrehen

    // Karte wird angezeigt, also zählt es zu gelernten Vokabeln der Runde
    if (curr.value?.id) {
        gelernteIds.value.add(curr.value.id)
    }

    // Fortschritt berechnen
    const p = Math.round(((currIndex.value + 1) / totalCards.value) * 100)
    emit('update:progress', p)
}

/**
 * Zeigt die nächste Karte an.
 */
function nextCard() {
  if (currIndex.value < vokabelnStore.liste.length - 1) {
    currIndex.value++
    updateCard()
  }
}

/**
 * Zeigt die vorherige Karte an.
 */
function prevCard() {
  if (currIndex.value > 0) {
    currIndex.value--
    updateCard()
  }
}

/**
 * Runde neu starten und die erste Karte anzeigen.
 */
function restart() {
    currIndex.value = 0
    gelernteIds.value.clear();
    updateCard()
}

/**
 * Shuffle-Modus aktivieren bzw. deaktivieren.
 * Bei aktivem Shuffle wird die Liste gemischt.
 * Bei deaktiviert wird die Originalreihenfolge wiederhergestellt.
 */
function toggleShuffle() {
    shuffleActive.value = !shuffleActive.value
    if (shuffleActive.value) {
    // Shuffle aktiv -> mische die Liste
    vokabelnStore.liste = [...originalList.value].sort(() => Math.random() - 0.5)
    } else {
    // Shuffle deaktiviert -> Originalreihenfolge wiederherstellen
    vokabelnStore.liste = [...originalList.value]
    }
    currIndex.value = 0
    gelernteIds.value.clear();
    updateCard()
}

/**
 * Anzeige Richtung umschalten.
 * true: Vokabel vorne
 * false: Übersetzung vorne
 */
function toggleDirection() {
    vokabelVorne.value = !vokabelVorne.value
    isFlipped.value = false // immer auf Vorderseite zurück
}

</script>

<template>
  <!-- ROOT  -->
  <div class="flex flex-col">
    
    <!-- Card Area -->
    <div class="flex-1 flex items-center justify-center">
      <div
        class="relative w-[90vw] max-w-md h-[65vh] cursor-pointer perspective"
        @click="flipCard"
      >
        <!-- Card -->
        <div
          class="w-full h-full transition-transform duration-500 transform-style-preserve-3d"
          :class="{ 'rotate-y-180': isFlipped }"
        >
          <!-- Vorderseite -->
          <Card class="absolute inset-0 shadow-xl p-6 backface-hidden flex flex-col items-center justify-center" v-show="!isFlipped">
            <h2 class="text-xl font-semibold"> {{ vokabelVorne ? curr?.vokabel : curr?.uebersetzung}} </h2>
            <p class="mt-2"> {{ curr?.beschreibung }} </p>
          </Card>

          <!-- Rückseite -->
          <Card class="absolute inset-0 shadow-xl p-6 backface-hidden rotate-y-180 flex items-center justify-center" v-show="isFlipped">
            <h2 class="text-xl font-semibold"> {{ vokabelVorne ? curr?.uebersetzung : curr?.vokabel}} </h2>
          </Card>

        </div>
      </div>
    </div>

    <!-- Buttons -->
    <div class="flex justify-center gap-9 mt-5">

        <!-- Zurück Button -->
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>
                    <button class="disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent cursor-pointer" 
                        @click="prevCard" 
                        :disabled="currIndex === 0">
                        <ArrowLeftIcon /> 
                    </button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Zurück</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>

        <!-- Shuffle Button -->
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>
                    <button @click="toggleShuffle"
                        :class="shuffleActive ? 'bg-gray-200 text-blue-600' : 'bg-white text-black'"
                        class="p-2 rounded-full transition hover:bg-gray-100"
>
                        <ShuffleIcon /> 
                    </button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{{ shuffleActive ? "Shuffle aus" : "Shuffle ein" }}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
        
        <!-- Anzeige Richtung -->
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>
                    <button @click="toggleDirection"> 
                        <RefreshCcwIcon /> 
                    </button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{{ vokabelVorne ? "Übersetzung zuerst" : "Vokabel zuerst" }}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>

        <!-- Neu starten -->
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>
                    <button class="disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent cursor-pointer"  
                        @click="restart" 
                        :disabled="currIndex === 0"> 
                        <RotateCcwIcon /> 
                    </button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Von vorne anfangen</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>

        <!-- Nächste Button -->
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>
                    <button class="disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent cursor-pointer"  
                        @click="nextCard" 
                        :disabled="currIndex === vokabelnStore.liste.length - 1"> 
                        <ArrowRightIcon /> 
                    </button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Weiter</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
      
      
    </div>
  </div>
</template>

<style scoped>
    .perspective {
    perspective: 1000px;
    }

    .transform-style-preserve-3d {
    transform-style: preserve-3d;
    }

    .backface-hidden {
    backface-visibility: hidden;
    }

    .rotate-y-180 {
    transform: rotateY(180deg);
    }
</style>
