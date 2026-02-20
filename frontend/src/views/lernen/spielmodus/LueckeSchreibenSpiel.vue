<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Vokabeln } from '@/models/Vokabeln'
import { Input } from '@/components/ui/input'

const PLACEHOLDER = '_____'

const props = defineProps<{ vokabel: Vokabeln }>()

/** State */
const userInput = ref('')
const checked = ref(false)
const richtig = ref(false)

/** intern */
const korrektesWort = ref('')
const satzMitLuecke = ref('')

/**
 * Neue Vokabel → Lücke neu erzeugen
 * (entspricht setVokabel im Android ViewModel)
 */
watch(
  () => props.vokabel?.id,
  () => {
    userInput.value = ''
    checked.value = false
    richtig.value = false

    if (!props.vokabel?.vokabel) return

    const original = props.vokabel.vokabel

    // Satzzeichen entfernen
    const cleaned = original.replace(/[,\.!?;:…]/g, '')
    const woerter = cleaned.split(/\s+/)

    const randomIndex = Math.floor(Math.random() * woerter.length)
    korrektesWort.value = woerter[randomIndex]!

    // erstes Vorkommen ersetzen
    satzMitLuecke.value = original.replace(
      new RegExp(`\\b${korrektesWort.value}\\b`),
      PLACEHOLDER
    )
  },
  { immediate: true }
)

/**
 * Prüfung (entspricht checkAnswer)
 */
function pruefen(): boolean {
  if (checked.value) return richtig.value

  const input = userInput.value.trim()
  richtig.value = input === korrektesWort.value

  checked.value = true
  return richtig.value
}

/**
 * Satz nach Prüfung (Platzhalter farbig ersetzen)
 */
const satzNachPruefung = computed(() => {
  if (!checked.value) return satzMitLuecke.value

  const colorClass = richtig.value
    ? 'text-success font-bold'
    : 'text-warning font-bold'

  const [before, after] = satzMitLuecke.value.split(PLACEHOLDER)

  return `${before}<span class="${colorClass}">${korrektesWort.value}</span>${after}`
})

defineExpose({ pruefen, feedbackTitle: 'Übersetzung:' })
</script>

<template>
  <div class="max-w-4xl mx-auto flex flex-col items-center space-y-8 px-4">

    <div class="text-center space-y-4 animate-in fade-in zoom-in duration-500 w-full">

        <!-- Anweisung -->
        <span class="text-xs font-bold uppercase tracking-[0.2em] text-surface-foreground/50 block">
            Fülle die Lücke
        </span>

        <!-- Satz mit Lücke -->
        <h2
        class="font-black text-foreground tracking-tight leading-tight mx-auto text-2xl sm:text-4xl max-w-3xl"
        v-html="satzNachPruefung"
        > </h2>

    </div>

    <div class="w-full relative pb-6">
        <!-- Eingabe -->
        <Input
        v-model="userInput"
        placeholder="Fehlendes Wort eingeben…"
        :disabled="checked"
        class="h-20 sm:h-28 sm:text-xl md:text-xl text-center font-bold bg-secondary/20 border-2 border-transparent focus-visible:border-secondary focus-visible:ring-0 transition-all rounded-2xl shadow-inner w-full"
        autofocus
        />

        <div 
            class="absolute bottom-4 left-0 h-2 bg-secondary transition-all duration-500 rounded-full z-10"
            :class="userInput.length > 0 ? 'w-full opacity-100' : 'w-0 opacity-0'"
        ></div>
    </div>
  </div>
</template>