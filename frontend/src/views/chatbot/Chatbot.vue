<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useVkStore } from "@/stores/vokabelKontoStore"
import { useKontoStore } from "@/stores/kontoStore"
import type { Vokabeln } from "@/models/Vokabeln"

const vkStore = useVkStore()
const kontoStore = useKontoStore()

const sentence = ref("")
const loading = ref(false)
const userInput = ref("")
const feedback = ref("")      // Für UI-Feedback vom Evaluator
const comment = ref("")       // Technische Begründung 
const suggestion = ref("")    // Korrekturvorschlag
const rating = ref("")        // Bewertung (correct/almost_correct/wrong)
const firstAttempt = ref(true) // Flag für ersten Versuch

// TODO: lernset dynamisch setzen
const lernsetId = ref("wNow2k3gBJDuucdMPzci")

const kontoId = computed(() => kontoStore.aktuellesKonto?.id);
const aktuelleSprache = computed(() => kontoStore.aktuelleSprache);
const vokabel = computed<Vokabeln | null>(() => vkStore.aktuelleFrage ?? null)
const isRundeFertig = computed<boolean>(() => vkStore.rundeFertig)

// Sprache in ISO-Code übersetzen
const languageMap: Record<string,string> = {
  "Englisch": "en",
  "Deutsch": "de",
  "Französisch": "fr",
  "Spanisch": "es"
}

onMounted(async () => {
    vkStore.resetRunde()
    await vkStore.ladeVokabeln(lernsetId.value)
})

// TODO: wird nach dem Auswahl von Lernset aufgerufen; erstmal manuell per Button-Klick
async function loadSentence() {
  if(isRundeFertig.value) {
    vkStore.resetRunde()
    console.log("Keine offene Vokabeln mehr")
    return
  }

  // wenn Vokabel ein Satz ist, nächste Vokabel holen
  while (!vokabel.value?.isWort) {
    console.log("KEIN WORT --- Konto: " + kontoId.value + "; Sprache: " + aktuelleSprache.value?.sprache + "; Vokabel: " + vokabel.value?.vokabel)
    vkStore.nextFrage()
  }

  if(!vokabel.value)
    return
  
  console.log("Konto: " + kontoId.value + "; Sprache: " + aktuelleSprache.value?.sprache + "; Vokabel: " + vokabel.value?.vokabel)

  loading.value = true
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
  firstAttempt.value = true
  feedback.value = ""
  comment.value = ""
  suggestion.value = ""
  rating.value = ""
  userInput.value = ""
}

// TODO: diese automatisch nach der zweiter Versuch/richtige Antwort aufrufen; erstmal manuell per Button-Klick
function nextVokabel() {
  feedback.value = ""
  userInput.value = ""
  vkStore.nextFrage()
  loadSentence()
}

async function checkAnswer() {
  if (!vokabel.value || !userInput.value) return

  loading.value = true

  const res = await fetch("http://localhost:8000/evaluate-answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_answer: userInput.value,
      original_sentence: sentence.value,
      target_word: vokabel.value.vokabel,
      target_language: languageMap[aktuelleSprache.value?.sprache]
    })
  })

  const data = await res.json()

  // Logik für zweite Chance
  if(firstAttempt.value && data.rating !== "correct") {
      // Beim ersten Fehlversuch nur Tipp anzeigen
      feedback.value = data.hint || "Überprüfe deine Antwort noch einmal."
      comment.value = ""
      suggestion.value = ""
      rating.value = ""
      firstAttempt.value = false
  } else {
      // Zweiter Versuch oder korrekt -> volles Feedback
      feedback.value = data.feedback
      comment.value = data.comment || ""
      suggestion.value = data.suggestion || ""
      rating.value = data.rating || ""
  }
  loading.value = false
}

</script>

<template>
  <h1>Chatbot</h1>

  <Button @click="loadSentence" :disabled="loading">
    Satz generieren
  </Button>

  <p v-if="loading">Lade...</p>
  <p v-if="sentence">{{ sentence }}</p>

  <Input v-model="userInput"
          placeholder="Fehlendes Wort eingeben…"
          :disabled="loading"
          class="h-20 sm:h-28 sm:text-xl md:text-xl text-center font-bold bg-secondary/20 border-2 border-transparent focus-visible:border-secondary focus-visible:ring-0 transition-all rounded-2xl shadow-inner w-full"
          autofocus>
    </Input>

    <Button @click="checkAnswer" :disabled="loading">
      Senden
    </Button>

    <div v-if="feedback">
      <p><strong>Feedback:</strong> {{ feedback }}</p>
      <p v-if="suggestion"><strong>Vorschlag:</strong> {{ suggestion }}</p>
      <p v-if="comment"><em>Kommentar:</em> {{ comment }}</p>
      <p v-if="rating"><em>Bewertung:</em> {{ rating }}</p>
  </div>

  <Button @click="nextVokabel" :disabled="loading">
    Nächste Vokabel
  </Button>

</template>
