<script setup lang="ts">
import { ref } from "vue"
import { Button } from '@/components/ui/button'

const sentence = ref("")
const loading = ref(false)

async function loadSentence() {
  loading.value = true

  const res = await fetch("http://localhost:8000/generate-sentence", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      word: "apple",
      language: "Englisch"
    })
  })

  const data = await res.json()

  sentence.value = data.sentence
  loading.value = false
}
</script>

<template>
  <h1>Chatbot</h1>

  <Button @click="loadSentence">
    Satz generieren
  </Button>

  <p v-if="loading">Lade...</p>
  <p v-if="sentence">{{ sentence }}</p>

</template>
