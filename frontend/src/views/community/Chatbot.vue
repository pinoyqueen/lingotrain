<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { Button } from '@/components/ui/button'
import { useVkStore } from "@/stores/vokabelKontoStore"
import { useKontoStore } from "@/stores/kontoStore"
import type { Vokabeln } from "@/models/Vokabeln"

const vkStore = useVkStore()
const kontoStore = useKontoStore()

const sentence = ref("")
const loading = ref(false)

// TODO: lernset dynamisch setzen
const lernsetId = ref("wNow2k3gBJDuucdMPzci")

const kontoId = computed(() => kontoStore.aktuellesKonto?.id);
const aktuelleSprache = computed(() => kontoStore.aktuelleSprache);
const vokabel = computed<Vokabeln | null>(() => vkStore.aktuelleFrage ?? null)
const isRundeFertig = computed<boolean>(() => vkStore.rundeFertig)


onMounted(async () => {
    vkStore.resetRunde()
    await vkStore.ladeVokabeln(lernsetId.value)
})

async function loadSentence() {
  if(isRundeFertig.value) {
    vkStore.resetRunde()
    console.log("Keine offene Vokabeln mehr")
    return
  }
  loading.value = true

  if(vokabel.value)
    console.log("Konto: " + kontoId.value + "; Sprache: " + aktuelleSprache.value?.sprache + "; Vokabel: " + vokabel.value?.vokabel)

  const res = await fetch("http://localhost:8000/generate-sentence", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      word: vokabel.value?.uebersetzung,
      language: aktuelleSprache.value?.sprache
    })
  })

  
  const data = await res.json()

  sentence.value = data.sentence
  loading.value = false

  // zum Testen: nächste Vokabel anzeigen 
  vkStore.nextFrage()
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
