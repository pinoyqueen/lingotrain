<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Vokabeln } from '@/models/Vokabeln'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const props = defineProps<{ vokabel: Vokabeln }>()

const userInput = ref('')
const checked = ref(false)
const richtig = ref(false)

watch(() => props.vokabel?.id, () => {
  userInput.value = ''
  checked.value = false
})

function pruefen(): boolean {
  if (checked.value) return richtig.value

  richtig.value =
    userInput.value.trim().toLowerCase() ===
    props.vokabel.vokabel.toLowerCase()

  checked.value = true
  return richtig.value
}

defineExpose({ pruefen })
</script>

<template>
  <div class="space-y-3 w-full">
    <Label class="text-muted-foreground text-sm">
      Übersetze:
    </Label>

    <h2 class="text-xl font-semibold">
      {{ props.vokabel.uebersetzung }}
    </h2>

    <Input
      v-model="userInput"
      placeholder="Antwort eingeben…"
      :disabled="checked"
      class="text-lg"
    />
  </div>
</template>
