<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Vokabeln } from '@/models/Vokabeln'
import { Button } from '@/components/ui/button'
import { useVokabelnStore } from '@/stores/vokabelnStore'

/** Empfängt das Vokabel-Objekt vom Parent {@link ContainerSpiel} */
const props = defineProps<{ vokabel: Vokabeln }>()

/** Vokabeln-Store */
const vokabelnStore = useVokabelnStore()

/** WortPool mit allen Wörtern des aktuellen Lernsets (Sätze sind in Wörter unterteilt) */
const wortPool = computed(() => vokabelnStore.wortPool)

/** Reaktiver State für die Bausteine, die dem Nutzer zur Auswahl stehen mit den einzelnen Wörtern */
const bausteine = ref<{id: number, word: string}[]>([])

/** Reaktiver State für die Bausteine, die der Nutzer ausgewählt hat */
const ausgewaehlt = ref<{id: number, word: string}[]>([])

/** Reaktiver State, ob der Nutzer bereits auf "Prüfen" geklickt hat */
const checked = ref(false)

/** War die Antwort des Nutzers richtig? */
const richtig = ref(false)

// Watcher, um die Bausteine bei neuen Vokabeln neu zu generieren
watch(() =>
 props.vokabel?.id, generateBausteine, 
 { immediate: true }
)

/**
 * Normalisiert einen Satz.
 * 
 * Hier werden aus einem übergebenen String, also einem Satz,
 * alle Satzzeichen entfernt sowie die Leerzeichen am Anfang und
 * Ende.  
 * 
 * @param {string} sentence der zu normalisierende Satz
 * @return {string} der normalisierte Satz
 */
function normalize(sentence: string) {
  return sentence.replace(/[,.!?;:…]/g, '').trim()
}

/**
 * Generieren der Bausteine.
 * 
 * Diese Methode generiert die Bausteine, aus denen der Nutzer 
 * die Wörter auswählen kann. Dabei wird zunächst der Originalsatz
 * in seine einzelnen Wörter zerlegt und als Bausteine hinzugefügt.
 * Anschließend werden maximal 4 zufällige Wörter aus dem Lernset
 * ebenfalls als Bausteine hinzugefügt. Dabei wird jedoch darauf geachtet,
 * dass ein Wort nicht mehrfach eingefügt wird.
 */
function generateBausteine() {
  if (!props.vokabel) return

  // Den Originalsatz in Wörter zerteilen
  const korrekt = normalize(props.vokabel.vokabel).split(/\s+/)
  const korrektBausteine = korrekt.map((w, i) => ({ id: i, word: w }))

  // Duplikate und Originalwörter aus dem Wortpool entfernen
  const uniquePool = Array.from(new Set(wortPool.value))
  const kandidaten = uniquePool.filter(w => !korrekt.includes(w))

  // Wortpool mischen und maximal 4 auswählen, die als Bausteine eingefügt werden
  shuffle(kandidaten)
  const extraBausteine = kandidaten.slice(0, 4).map((w, i) => ({
    id: i + korrekt.length,
    word: w
  }))

  // Alles zusammenmischen
  bausteine.value = shuffle([...korrektBausteine, ...extraBausteine])
  ausgewaehlt.value = []
  checked.value = false
}

/**
 * Mischt die Werte aus einem Array.
 * 
 * @param {T[]} arr das Array, aus dem die Werte eines generischen Typs gemischt werden
 * @return {T[]} das gemischte Array
 */
function shuffle<T>(arr: readonly T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = copy[i]!
    copy[i] = copy[j]!
    copy[j] = temp
  }

  return copy
}

/**
 * Fügt einen Baustein zu den ausgewählten Wörtern (Bausteinen)
 * hinzu, die später mit dem Satz verglichen werden sollen.
 * 
 * Aus dem Pool werden die Wörter nicht entfernt, sondern nur unsichtbar
 * gestaltet, damit die Reihenfolge nicht vermischt wird und die
 * Nutzer nicht verwirrt sind durch die Positionsänderung der Bausteine.
 * 
 * @param baustein der Baustein, der hinzugefügt werden soll
 */
function addWord(baustein: {id: number, word: string}) {
  if (checked.value) return
  ausgewaehlt.value.push(baustein)
}

/**
 * Entfernt einen Baustein aus den ausgewählten Wörtern (Bausteinen).
 * 
 * @param index der Index, an dem der Baustein aus den ausgewählten entfernt werden muss 
 */
function removeWord(index: number) {
  if (checked.value) return
  ausgewaehlt.value.splice(index, 1)
}

/**
 * Gibt an, ob ein Baustein ausgewählt wurde oder nicht.
 * 
 * Dies ist z.B. wichtig, um die Bausteine, die ausgewählt wurden,
 * in der Auswahlliste unten ausblenden zu können, damit der Nutzer
 * sie nicht mehr sieht und nicht erneut hinzufügen kann.
 * 
 * @param baustein der Baustein
 */
function isUsed(baustein: {id: number, word: string}) {
  return ausgewaehlt.value.some(a => a.id === baustein.id)
}

/**
 * Vergleichen der User-Eingabe mit der Lösung.
 * 
 * Hier werden zunächst die Wörter der ausgewählten Bausteine zu einem
 * Satz zusammengefügt. Danach wird der Originalsatz normalisiert, sodass
 * beide Sätze ohne Satzzeichen etc. verglichen werden können.
 * Anschließend wird geprüft, ob die Eingabe mit der Lösung übereinstimmt.
 * 
 * Wird über defineExpose des Parent-Buttons aufgerufen.
 */
function pruefen(): boolean {
  if (checked.value) return richtig.value

  const eingabe = ausgewaehlt.value.map(w => w.word).join(' ').trim()
  const loesung = normalize(props.vokabel.vokabel)

  richtig.value = (eingabe === loesung)

  checked.value = true
  return richtig.value
}

// die Parent-Komponente kann die pruefen-Funktion nutzen und erhält die Lösung
defineExpose({
  pruefen,
  feedbackLoesung: () => props.vokabel.vokabel
})
</script>

<template>
  <div class="w-full flex flex-col gap-6">
    <div class="text-center space-y-4">
      <span class="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
        Satz bilden
      </span>
      <h2 class="text-2xl sm:text-4xl font-black tracking-tight">
        {{ props.vokabel.uebersetzung }}
      </h2>
    </div>

    <div class="w-full min-h-[100px] bg-secondary/10 border-2 border-dashed border-secondary/30 rounded-2xl p-6 flex flex-wrap gap-2 transition-all duration-300">
      <Button
        v-for="(word, index) in ausgewaehlt"
        :key="word.id"
        size="sm"
        variant="default"
        class="shadow-sm text-secondary-foreground/70"
        @click="removeWord(index)"
      >
        {{ word.word }}
      </Button>

      <span v-if="ausgewaehlt.length === 0" class="italic text-muted-foreground/50 self-center">
        Wörter hier anklicken…
      </span>
    </div>

    <div class="bausteine-wrapper">
      <div class="flex flex-wrap gap-2 justify-center">
        <Button
          v-for="word in bausteine"
          :key="word.id"
          size="sm"
          variant="secondary"
          :class="[
            'transition-all duration-200 border border-secondary/20 shadow-sm',
            isUsed(word) ? 'opacity-0 pointer-events-none scale-90' : 'hover:scale-105'
          ]"
          @click="addWord(word)"
        >
          {{ word.word }}
        </Button>
      </div>
    </div>
  </div>
</template>