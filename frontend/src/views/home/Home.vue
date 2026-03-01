<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Flame, Trophy } from 'lucide-vue-next'

import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem
} from '@/components/ui/select'

import { useKontoStore } from '@/stores/kontoStore'
import { useLernsetStore } from '@/stores/lernsetStore'
import { LevelCalculator } from '@/models/LevelCalculator'

const router = useRouter()
const kontoStore = useKontoStore()
const lernsetStore = useLernsetStore()
const calculator = new LevelCalculator()

// Computeds für Level / Punkte 
const punkte = computed(() => kontoStore.aktuellesKonto?.punkte || 0);
const level = computed(() => calculator.level(punkte.value));
const progress = computed(() => calculator.progress(punkte.value));
const flamme = computed(() =>  kontoStore.aktuellesKonto?.anzTage);
const punkteBisNaechstesLevel = computed(() => calculator.punkteBisNaechstesLevel(punkte.value));

/** Beim Mount Flamme prüfen */
onMounted(async () => {
    kontoStore.checkFlamme()
})

/** 
 * Lernset-Shortcuts erstellen
 */ 
const shortcuts = computed(() => lernsetStore.sets.slice(0, 3));

/**
 * Navigation zu einem bestimmten Lernset.
 * 
 * Diese Funktion navigiert zu einem bestimmten Lernset, d.h.
 * beim Klick auf einen der Lernset-Buttons dient der Button
 * als Shortcut und es wird direkt zum Lernset weitergeleitet.
 * 
 * @param id die ID des Lernsets
 * @param name der Name des Lernsets
 */
function navigateToLernset(id: string, name: string) {
  
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  
  router.push({ 
    name: 'lernset', 
    params: { 
      id: id,
      slug: slug
    }
  })
}
</script>

<template>
  <div class="flex-1 h-[calc(100vh-60px)] px-6 pb-6 lg:px-10 bg-background flex flex-col gap-8 overflow-y-auto">   
    <header class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      
      <!-- Ausgabe der Begrüßung mit dem Namen -->
      <h1 class="text-4xl text-primary font-bold tracking-tight leading-tight">
        Hallo, {{ kontoStore.aktuellesKonto?.vorname }} {{ kontoStore.aktuellesKonto?.nachname }}!
      </h1>

      <!-- Auswahl der aktuellen Sprache aus allen Sprachen, die der Nutzer seinem Konto hinzugefügt hat -->
      <div class="space-y-1 w-full sm:w-[240px]">
        <Label class="mb-1.5 px-1 text-xs font-bold text-muted-foreground uppercase">Lernsprache</Label>
        
        <Select 
          :model-value="kontoStore.aktuellesKonto?.aktuelleSpracheId" 
          :disabled="!kontoStore.aktuelleSprache || kontoStore.ausgewaehlteSprachen.length === 0"
          @update:model-value="(val) => kontoStore.updateAktuelleSprache(String(val))"
        >
          <SelectTrigger class="w-full bg-background border-2 shadow-sm">
            <div class="flex items-center gap-4">
                <template v-if="kontoStore.aktuelleSprache">
                  <img :src="kontoStore.aktuelleSprache.flagge" class="h-4 w-auto" />
                  <span class="font-medium">{{ kontoStore.aktuelleSprache.sprache }}</span>
                </template>
                <span v-else>Wähle eine Sprache</span>
            </div>
          </SelectTrigger>

          <SelectContent>
            <SelectItem 
              v-for="s in kontoStore.ausgewaehlteSprachen" 
              :key="s.id" 
              :value="s.id"
            >
              <div class="flex items-center gap-3">
                <img :src="s.flagge" class="h-4 w-auto" />
                <span>{{ s.sprache }}</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

    </header>

    <!-- Ausgabe des aktuellen Levels und der Lernserie -->
    <div class="w-full bg-secondary border border-secondary rounded-xl p-6 shadow-sm">
      <div class="flex items-center justify-around">
        <div class="flex flex-col items-center gap-1">
          <span class="text-xs font-bold uppercase text-secondary-foreground/70">Aktuelles Level</span>
          <div class="flex items-center gap-2">
            <Trophy class="w-6 h-6 text-secondary-foreground" />
            <span class="text-2xl font-black text-secondary-foreground">Level {{ level }}</span>
          </div>
        </div>

        <div class="h-10 w-[1px] bg-secondary-foreground/20"></div>

        <div class="flex flex-col items-center gap-1">
          <span class="text-xs font-bold uppercase text-secondary-foreground/70">Lernserie</span>
          <div class="flex items-center gap-2">
            <span class="text-2xl font-black text-secondary-foreground">{{flamme }} </span>
            <Flame class="w-6 h-6 text-secondary-foreground fill-secondary-foreground" />
          </div>
        </div>
      </div>
    </div>

    <!-- Grid, damit Card links und Buttons rechts daneben angezeigt werden; bei kleineren Bildschirmen Buttons unterhalb von Card -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch flex-grow">
      
      <!-- Card mit dem aktuellen Punktestand und einem Fortschrittsbalken -->
      <div class="lg:col-span-2">
        <Card class="h-full border-2 shadow-sm bg-primary-variant">
          <CardContent class="py-4 flex flex-col h-full space-y-8">
            <div class="flex-grow flex flex-col items-center justify-center py-12 bg-white rounded-2xl">
              <span class="text-7xl font-black text-surface-foreground/90">{{ punkte }}</span>
              <span class="text-sm font-bold text-surface-foreground/50 uppercase tracking-widest mt-2">
                Gesamtpunkte
              </span>
            </div>

            <div class="space-y-4">
              <div class="flex justify-between items-end">
                <div class="flex flex-col">
                  <span class="text-sm font-bold text-primary-foreground">Fortschritt</span>
                  <span class="text-xs text-primary-foreground">Bis zum nächsten Level</span>
                </div>
                <span class="font-bold text-primary-foreground">Noch {{ punkteBisNaechstesLevel }} XP</span>
              </div>
              <Progress :model-value="progress" class="h-4 bg-primary-foreground/30" style="--primary: white;" />
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Buttons für Lernset-Shortcuts -->
      <aside class="flex flex-col gap-4 h-full">
        <h2 class="text-sm font-bold text-surface-foreground/70 uppercase tracking-wider px-1">
          Schnellstart Lernsets
        </h2>
        
        <div 
          v-if="shortcuts.length > 0" 
          class="flex flex-col gap-4 flex-grow"
        >
          <Button 
            v-for="set in shortcuts" 
            :key="set.id"
            variant="secondary"
            class="flex-grow max-h-[200px] min-h-[100px] text-xl font-bold justify-center px-8 border-2 shadow-sm whitespace-normal text-center"
            @click="navigateToLernset(set.id!, set.name)"
          >
            {{ set.name }}
          </Button>
        </div>

        <div v-else class="flex-grow flex items-center justify-center border-2 border-dashed rounded-xl text-muted-foreground bg-slate-50/50">
          Keine Lernsets vorhanden.
        </div>
      </aside>

    </div>
  </div>
</template>