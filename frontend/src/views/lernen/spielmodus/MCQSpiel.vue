<script setup lang="ts">
import type { Vokabeln } from '@/models/Vokabeln'
import { ref, watch } from 'vue'
import Button from '@/components/ui/button/Button.vue';
import { useVkStore } from '@/stores/vokabelKontoStore';

/** Empfängt das Vokabel-Objekt vom Parent {@link ContainerSpiel} */
const props = defineProps<{ vokabel: Vokabeln }>()

const vkStore = useVkStore()

// Distractors + richtige Vokabel mischen
const options = ref<Vokabeln[]>([])

/** War die Antwort des Nutzers richtig? */
const richtig = ref(false)
const selectedOption = ref<Vokabeln | null>(null)
const checked = ref(false)

function mixOptions() {
  // 3 falsche Optionen holen
  const distractors = vkStore.getDistractors(props.vokabel, 3)
  // richtige in der Liste einfügen
  const allOptions = [...distractors, props.vokabel]

  // Shuffle 
  for (let i = allOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = allOptions[i]
    if(allOptions[j])
      allOptions[i] = allOptions[j]
    if(temp)
      allOptions[j] = temp
  }

  options.value = allOptions
}

// WICHTIG: null-safe auflösen mit Optional Chaining
watch(() => props.vokabel?.id, () => {
  selectedOption.value = null
  richtig.value = false
  checked.value = false
  mixOptions()
}, { immediate: true } )

// Prüflogik – passe an deine fachliche Logik an
function pruefen(): boolean {
  if (!selectedOption.value) return false
    richtig.value = selectedOption.value.id === props.vokabel.id
  checked.value = true
  return richtig.value
}


// die Parent-Komponente kann die pruefen-Funktion nutzen und erhält die Lösung
defineExpose({ 
  pruefen,
  feedbackLoesung: () => props.vokabel.uebersetzung 
})

</script>

<template>
  <div class="max-w-4xl mx-auto flex flex-col items-center justify-center space-y-6 sm:space-y-10 pt-4 sm:pt-10 px-4">
    
    <div class="text-center space-y-4 animate-in fade-in zoom-in duration-500 w-full">
      <span class="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/60 block">
        Wähle die richtige Übersetzung aus.
      </span>
      
      <h2 
        class="font-black text-foreground tracking-tight leading-tight mx-auto text-3xl sm:text-5xl max-w-2xl"
      >
        {{ props.vokabel.vokabel }}
      </h2>
      
      <div class="h-1 w-12 bg-primary/20 mx-auto rounded-full mt-2"></div>
    </div>

    <!-- MCQ Buttons -->
    <div class="w-full flex flex-col gap-4 mt-6">
      <Button
        v-for="option in options"
        :key="option.id"
        class="w-full text-left"
        :disabled="checked"
        :class="{
          'bg-primary text-white': selectedOption === option,
          'bg-muted-foreground/10 hover:bg-muted-foreground/20': selectedOption !== option
        }"
        @click="selectedOption = option"
      >
        {{ option.uebersetzung }}
      </Button>
    </div>
  </div>
</template>