<script setup lang="ts">
import type { Vokabeln } from '@/models/Vokabeln'
import { ref, watch } from 'vue'
import Button from '@/components/ui/button/Button.vue';

const props = defineProps<{
  vokabel: Vokabeln
}>()
const emit = defineEmits<{ (e: 'answered', result: boolean): void }>()

const selectedOption = ref<string | null>(null)

// WICHTIG: null-safe auflösen mit Optional Chaining
watch(
  () => props.vokabel?.id, // <- Zugriff ist sicher
  (newId, oldId) => {
    if (!newId) return  // guard, falls beim ersten Tracken noch keine Vokabel da ist
    selectedOption.value = null // reset beim Fragenwechsel
  }
)

// Prüflogik – passe an deine fachliche Logik an
function pruefen(): boolean {
  // Beispiel: Richtig, wenn ausgewählte Option der Übersetzung entspricht
  // const ok = selectedOption.value != null && selectedOption.value === props.vokabel.uebersetzung
  const ok = true
  emit('answered', ok) // optional, falls du zusätzlich ein Event willst
  return ok
}


// Methode für den Parent freigeben
defineExpose({ pruefen })
</script>

<template>
  <h2>Paare Spiel: {{ props.vokabel.vokabel }}</h2>
  <Button variant="outline" class="bg-[var(--button-primary)]" @click="pruefen">Lösung prüfen</Button>
</template>