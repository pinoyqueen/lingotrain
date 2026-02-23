<script setup lang="ts">
import type { Vokabeln } from '@/models/Vokabeln'
import { ref, watch } from 'vue'
import Button from '@/components/ui/button/Button.vue';
import { useVkStore } from '@/stores/vokabelKontoStore';

// --- Props vom Parent ---
/** Empfängt das Vokabel-Objekt vom Parent ContainerSpiel */
const props = defineProps<{ vokabel: Vokabeln }>()

// --- Vokabel-Konto Store für Distractors ---
const vkStore = useVkStore()

// --- State/Refs ---
/** Array der Antwortoptionen (richtige + Distractors), zufällig gemischt */
const options = ref<Vokabeln[]>([])
/** true/false, ob der Nutzer die richtige Antwort gewählt hat */
const richtig = ref(false)
/** aktuell vom Nutzer ausgewählte Option */
const selectedOption = ref<Vokabeln | null>(null)
/** Flag, ob die Antwort bereits überprüft wurde, verhindert Mehrfachklick */
const checked = ref(false)

/**
 * Generiert Distractors, fügt die richtige Antwort hinzu und mischt die Optionen.
 */
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

/**
 * Prüft die Antwort des Nutzers.
 * 
 * @returns true, wenn richtig, sonst false
 */
function pruefen(): boolean {
  checked.value = true
  if (!selectedOption.value) return false
    richtig.value = selectedOption.value.id === props.vokabel.id
  return richtig.value
}

/** Watch auf props.vokabel.id: Wenn die Vokabel wechselt, wird Auswahl/Flags zurückgesetzt */
watch(() => props.vokabel?.id, () => {
  selectedOption.value = null
  richtig.value = false
  checked.value = false
  mixOptions()
}, { immediate: true } )


// die Parent-Komponente kann die pruefen-Funktion nutzen und erhält die Lösung
defineExpose({ 
  pruefen,
  feedbackLoesung: () => props.vokabel.uebersetzung 
})

</script>

<template>
  <div class="max-w-4xl mx-auto flex flex-col items-center space-y-8 px-4">
    
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