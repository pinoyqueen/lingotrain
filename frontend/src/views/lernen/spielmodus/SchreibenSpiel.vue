<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Vokabeln } from '@/models/Vokabeln'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

/** Empfängt das Vokabel-Objekt vom Parent {@link ContainerSpiel} */
const props = defineProps<{ vokabel: Vokabeln }>()

/** Reaktiver State für die Usereingabe */
const userInput = ref('')

/** Reaktiver State, ob der Nutzer bereits auf "Prüfen" geklickt hat */
const checked = ref(false)

/** War die Antwort des Nutzers richtig? */
const richtig = ref(false)

/* Watcher, um die UI zu ändern, wenn eine neue Vokabel geladen wird;
 * es wird dann das Eingabefeld geleert und der Prüfstatus zurückgesetzt */
watch(() => props.vokabel?.id, () => {
  userInput.value = ''
  checked.value = false
})

/**
 * Vergleichen der User-Eingabe mit der Lösung.
 * 
 * Hier werden zunächst führende und nachfolgende Leerzeichen entfernt und
 * auch jede Art von Whitespace (Tabs, Zeilenumbrüche, mehrfache Leerzeichen)
 * aus der Eingabe und der Lösung durch ein einzelnes Leerzeichen ersetzt.
 * Anschließend wird geprüft, ob die Eingabe mit der Lösung übereinstimmt.
 * 
 * Wird über defineExpose des Parent-Buttons aufgerufen.
 */
function pruefen(): boolean {
  if (checked.value) return richtig.value

  // Es werden alle Arten von Whitespace durch ein einzelnes Leerzeichen ersetzt
  const cleanInput = userInput.value.trim().replace(/\s+/g, ' ')
  const cleanSolution = props.vokabel.vokabel.trim().replace(/\s+/g, ' ')

  richtig.value = (cleanInput === cleanSolution)

  checked.value = true
  return richtig.value
}

// die Parent-Komponente kann die pruefen-Funktion nutzen
defineExpose({ pruefen })
</script>

<template>
  <div class="max-w-4xl mx-auto flex flex-col items-center justify-center space-y-6 sm:space-y-10 pt-4 sm:pt-10 px-4">
    
    <div class="text-center space-y-4 animate-in fade-in zoom-in duration-500 w-full">
      <span class="text-xs font-bold uppercase tracking-[0.2em] text-surface-foreground/50 block">
        {{ vokabel.isWort ? 'Übersetze die Vokabel' : 'Übersetze den Satz' }}
      </span>
      
      <h2 
        class="font-black text-foreground tracking-tight leading-tight mx-auto"
        :class="vokabel.isWort ? 'text-3xl sm:text-5xl max-w-2xl' : 'text-2xl sm:text-4xl max-w-3xl'"
      >
        {{ props.vokabel.uebersetzung }}
      </h2>
      
      <div class="h-1 w-12 bg-primary/20 mx-auto rounded-full mt-2"></div>
    </div>

    <div class="w-full relative pb-6">

      <!-- Bei Wörtern einfaches einzeiliges Input-Feld -->
      <Input
        v-if="vokabel.isWort"
        v-model="userInput"
        placeholder="Antwort eingeben..."
        :disabled="checked"
        class="h-20 sm:h-28 sm:text-xl md:text-xl text-center font-bold bg-secondary/20 border-2 border-transparent focus-visible:border-secondary focus-visible:ring-0 transition-all rounded-2xl shadow-inner w-full"
        autofocus
      />

      <!-- Bei Sätzen mehrzeiliges Eingabefeld -->
      <Textarea
        v-else
        v-model="userInput"
        placeholder="Satz eingeben..."
        :disabled="checked"
        class="min-h-42 !text-xl w-full p-8 bg-secondary/20 border-2 border-transparent focus-visible:ring-offset-0 focus-visible:ring-0 focus-visible:border-secondary transition-all rounded-2xl shadow-inner resize-none block tracking-tight"
        autofocus
      />
      
      <div 
        class="absolute bottom-4 left-0 h-2 bg-secondary transition-all duration-500 rounded-full z-10"
        :class="userInput.length > 0 ? 'w-full opacity-100' : 'w-0 opacity-0'"
      ></div>
    </div>
  </div>
</template>