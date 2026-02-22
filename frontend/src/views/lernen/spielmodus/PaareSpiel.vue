<script setup lang="ts">
import type { Vokabeln } from '@/models/Vokabeln'
import { ref, watch } from 'vue'
import Button from '@/components/ui/button/Button.vue';
import { useVkStore } from '@/stores/vokabelKontoStore';
import { VOKABELN_STATUS } from '@/models/VokabelnStatus';

/** Empfängt das Vokabel-Objekt vom Parent {@link ContainerSpiel} */
const props = defineProps<{ vokabel: Vokabeln }>()

const vkStore = useVkStore()

// Liste von paare
const paare = ref<Vokabeln[]>([])
const leftList = ref<Vokabeln[]>([])
const rightList = ref<Vokabeln[]>([])
const matches = ref<Record<string, string>>({})
const rightAssigned = ref<Record<string, string>>({})
const draggedLeftId = ref<string | null>(null)
const checked = ref(false)
const resultMap = ref<Record<string, boolean>>({}) 

function shuffle<T>(array: T[]): T[] {
  const arr = [...array]

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))

    const temp = arr[i]!
    arr[i] = arr[j]!
    arr[j] = temp
  }

  return arr
}

function loadPaare() {
  const list = vkStore.getPaare(props.vokabel, 4)
  paare.value = list

  // Vokabeln für die linke Seite
  leftList.value = [...list]

  // Vokabeln für die rechte Seite gemischt
  rightList.value = shuffle(list)
  
  matches.value = {}
  rightAssigned.value = {}
  checked.value = false
  resultMap.value = {}
}

watch(
  () => props.vokabel?.id,
  () => loadPaare(),
  {immediate: true}
)

function onDragStart(v: Vokabeln) {
  if (checked.value) return
  if (v.id)
    draggedLeftId.value = v.id
}

function onDrop(right: Vokabeln) {
  if (checked.value) return
  if (!right.id) return
  if(!draggedLeftId.value) return
  if (rightAssigned.value[right.id]) return // right schon belegt

  matches.value[draggedLeftId.value] = right.id
  rightAssigned.value[right.id] = draggedLeftId.value

  draggedLeftId.value = null
}

function undo(right: Vokabeln) {
  if (checked.value) return
  if (!right.id) return
  const leftId = rightAssigned.value[right.id]
  if (!leftId) return

  delete matches.value[leftId]
  delete rightAssigned.value[right.id]
}

// Prüflogik
function pruefen(): boolean {
  let allesRichtig = true
  checked.value = true

  for(const left of leftList.value) {
    if (!left.id) continue
    const rightId = matches.value[left.id]
    const richtig = rightId === left.id

    resultMap.value[left.id] = richtig

    if(!richtig) allesRichtig = false

    if(richtig) {
      vkStore.updateStatus(left.id, VOKABELN_STATUS.RICHTIG)
    } else {
      vkStore.updateStatus(left.id, VOKABELN_STATUS.FALSCH)
    }
  }

  return allesRichtig
}


// Methode für den Parent freigeben
defineExpose({ 
  pruefen,
  feedbackTitle: ""
})
</script>

<template>
  <div class="max-w-4xl mx-auto flex flex-col items-center space-y-8 px-4">
    
    <div class="text-center space-y-4 animate-in fade-in zoom-in duration-500 w-full">
      <h2 
       class="text-xs font-bold uppercase tracking-[0.2em] block"
      >
        Ziehe jedes Wort links zu seiner Übersetzung rechts.
      </h2>
      <span class="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60 block">
        Tipp: Tippe auf eine rechte Vokabel, um die Zuordnung zu entfernen.
      </span>
      
      <div class="h-1 w-12 bg-primary/20 mx-auto rounded-full mt-2"></div>
    </div>

    <!-- PAARE ALS BUTTONS -->
    <div class="w-full relative pb-6">
      <div class="grid grid-cols-2 gap-8">
        <template v-for="(v, i) in leftList" :key="v.id">
  
          <!-- Linke Spalte -->
          <div class="flex">
            <Button
              draggable="true"
              class="w-full justify-start cursor-grab active:cursor-grabbing bg-primary text-white"
              :class="{ 'opacity-40 cursor-not-allowed': matches[v.id!] }"
              :disabled="checked || !!matches[v.id!]"
              @dragstart="onDragStart(v)"
            >
              {{ v.vokabel }}
            </Button>
          </div>

          <!-- Rechte Spalte -->
          <div class="flex flex-col">
            <Button
              variant="outline"
              class="w-full justify-start min-h-[48px] disabled:opacity-100"
              :disabled="checked"
              :class="[ 
                rightAssigned[rightList[i]!.id!] && !checked && 'border-primary bg-primary/10',
                // richtig
                checked && rightAssigned[rightList[i]!.id!] && resultMap[rightAssigned[rightList[i]!.id!]!] === true && 'bg-[var(--success)] text-white border-[var(--success)]',
                // falsch
                checked && rightAssigned[rightList[i]!.id!] && resultMap[rightAssigned[rightList[i]!.id!]!] === false && 'bg-[var(--warning)] text-white border-[var(--warning)]',
                // nicht zugeordnet
                checked && !rightAssigned[rightList[i]!.id!] && 'bg-[var(--warning)] text-white border-[var(--warning)]'
              ]"
              @dragover.prevent
              @drop="onDrop(rightList[i]!)"
              @click="undo(rightList[i]!)"
            >
              <template v-if="rightAssigned[rightList[i]!.id!]">
                <span class="font-medium">
                  {{ leftList.find(l => l.id === rightAssigned[rightList[i]!.id!])?.vokabel }}
                </span>
                <span class="mx-2" :class="checked ? 'text-white' : 'text-black'">→</span>
                <span>{{ rightList[i]!.uebersetzung }}</span>
              </template>
              <template v-else>
                {{ rightList[i]!.uebersetzung }}
              </template>
            </Button>

            <!-- Feedback unter dem Button -->
            <p
              v-if="checked && ((!rightAssigned[rightList[i]!.id!]) || resultMap[rightAssigned[rightList[i]!.id!]!] === false)"
              class="mt-1 text-xs text-[var(--warning)]"
            >
              Richtige Lösung: {{ leftList.find(l => l.id === rightList[i]!.id)?.vokabel }}
            </p>
          </div>
        </template>
        
      </div>
    </div>
  </div>
</template>