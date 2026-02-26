<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Vokabeln } from '@/models/Vokabeln'
import { Input } from '@/components/ui/input'

/** Platzhalter für die Lücke im Satz */
const PLACEHOLDER = '_____'

/** Empfängt das Vokabel-Objekt vom Parent {@link ContainerSpiel} */
const props = defineProps<{ vokabel: Vokabeln }>()

/** Reaktiver State für die Usereingabe */
const userInput = ref('')

/** Reaktiver State, ob der Nutzer bereits auf "Prüfen" geklickt hat */
const checked = ref(false)

/** War die Antwort des Nutzers richtig? */
const richtig = ref(false)

/** das korrekte Wort, welches in die Lücke passt */
const korrektesWort = ref('')

/** der Satz, in den für ein Wort eine Lücke mit Platzhalter eingebaut wurde */
const satzMitLuecke = ref('')

/* Watcher, um die UI zu ändern, wenn eine neue Vokabel geladen wird;
 * es wird dann das Eingabefeld geleert und der Prüfstatus zurückgesetzt.
 * Außerdem wird eine neue Lücke im Satz erzeugt.
 */
watch(() => props.vokabel?.id,
  () => {
    userInput.value = '';
    checked.value = false;
    richtig.value = false;

    generiereLuecke(props.vokabel);
  },
  { immediate: true }
)

/**
 * Erzeugen einer Lücke im Satz.
 * 
 * Dabei werden aus dem Satz (der Vokabel) alle Satzzeichen entfernt, damit der Nutzer
 * diese bei seiner Lücke nicht mit eingeben muss. Außerdem wird der Satz in seine
 * einzelnen Wörter aufgesplittet und ein zufälliges Wort aus dem Satz durch einen
 * Platzhalter für die Lücke erzeugt.
 * 
 * Der Satz mit Lücke und das korrekte Wort für die Lücke werden in den eigenen Variablen
 *  {@link #korrektesWort} und {@link #satzMitLuecke} gespeichert.
 * 
 * @param {Vokabeln} vokabel 
 */
function generiereLuecke(vokabel: Vokabeln) {
  if (!vokabel?.vokabel) return;

  const original = vokabel.vokabel;

  // Satzzeichen entfernen
  const cleaned = original.replace(/[,\.!?;:…]/g, '');
  const woerter = cleaned.split(/\s+/);

  // Zufälliges Wort auswählen
  const randomIndex = Math.floor(Math.random() * woerter.length);
  korrektesWort.value = woerter[randomIndex]!;

  // Bei mehreren Vorkommen wird ein zufälliges durch den Platzhalter ersetzt, damit nicht
  // vorhersehbar ist, welches der Vorkommen eines Wortes jedes Mal ersetzt wird
  satzMitLuecke.value = replaceRandomVorkommen(original, korrektesWort.value, PLACEHOLDER);
}

/**
 * Wählt ein zufälliges Vorkommen eines Wortes aus einem Satz aus. 
 * 
 * Hier werden alle Vorkommen eines Wortes in einem Satz ermittelt und 
 * zufällig eines davon ausgewählt und durch den Platzhalter ersetzt.
 * 
 * @param {string} sentence der Satz, in dem ein Wort ersetzt werden soll
 * @param {string} word das zu ersetzende Wort
 * @param {string} placeholder der Platzhalter
 */
function replaceRandomVorkommen(sentence: string, word: string, placeholder: string) {
  const regex = new RegExp(`\\b${word}\\b`, 'g');
  const matches = [...sentence.matchAll(regex)];

  if (matches.length === 0) return sentence;

  const randomMatch = matches[Math.floor(Math.random() * matches.length)];
  const start = randomMatch?.index!;
  const end = start + word.length;

  return sentence.slice(0, start) + placeholder + sentence.slice(end);
}

/**
 * Vergleichen der User-Eingabe mit der Lösung.
 * 
 * Hier werden zunächst führende und nachfolgende Leerzeichen entfernt.
 * Anschließend wird geprüft, ob die Eingabe mit dem korrekten Wort übereinstimmt.
 * 
 * Wird über defineExpose des Parent-Buttons aufgerufen.
 */
function pruefen(): { richtig: boolean } {
  if (checked.value) return { richtig: richtig.value };

  const input = userInput.value.trim();
  richtig.value = (input === korrektesWort.value);

  checked.value = true;
  return { richtig: richtig.value };
}

/**
 * Erstellt den Satz nach der Überprüfung.
 * 
 * Dabei wird der Platzhalter durch das korrekte Wort ersetzt.
 * War die Eingabe richtig, wird das korrekte Wort in grüner dargestellt,
 * ansonsten in roter Schrift.
 */
const satzNachPruefung = computed(() => {
  if (!checked.value) return satzMitLuecke.value

  const colorClass = richtig.value
    ? 'text-success font-bold'
    : 'text-warning font-bold'

  const [before, after] = satzMitLuecke.value.split(PLACEHOLDER)

  return `${before}<span class="${colorClass}">${korrektesWort.value}</span>${after}`
})

// die Parent-Komponente kann die pruefen-Funktion nutzen, erhält einen spezialisierten Feedback-Titel
// und die Übersetzung als Lösung
defineExpose({ 
    pruefen, 
    feedbackLoesung: () => props.vokabel.uebersetzung,
    feedbackTitle: 'Übersetzung:' 
})
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

        <!-- Eingabe des fehlenden Wortes -->
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