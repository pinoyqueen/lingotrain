<script setup lang="ts">
import { onMounted } from 'vue'
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

import { useHomeStore } from '@/stores/homeStore'

const router = useRouter()
const homeStore = useHomeStore()

onMounted(async () => {
  await homeStore.loadHomeValues()
})

function navigateToLernset(id: string, name: string) {
  router.push({ 
    name: 'vokabelnliste', 
    params: { lernsetId: id },
    query: { name: name } 
  })
}
</script>

<template>
  <div class="flex-1 h-[calc(100vh-60px)] px-6 pb-6 lg:px-10 bg-background flex flex-col gap-8 overflow-y-auto">   
    <header class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <h1 class="text-4xl text-primary font-bold tracking-tight leading-tight">
        Hallo, {{ homeStore.name }}!
      </h1>

      <div class="space-y-1 w-full sm:w-[240px]">
        <Label class="mb-1.5 px-1 text-xs font-bold text-muted-foreground uppercase">Lernsprache</Label>
        
        <Select 
          :model-value="homeStore.authStore.aktuellesKonto?.aktuelleSpracheId" 
          @update:model-value="(val) => homeStore.updateSprache(String(val))"
        >
          <SelectTrigger class="w-full bg-background border-2 shadow-sm">
            <div class="flex items-center gap-4">
                <template v-if="homeStore.aktuelleSprache">
                  <img :src="homeStore.aktuelleSprache.flagge" class="h-4 w-auto" />
                  <span class="font-medium">{{ homeStore.aktuelleSprache.sprache }}</span>
                </template>
                <span v-else>Wähle eine Sprache</span>
            </div>
          </SelectTrigger>

          <SelectContent>
            <SelectItem 
              v-for="s in homeStore.ausgewaehlteSprachen" 
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

    <div class="w-full bg-secondary border border-secondary rounded-xl p-6 shadow-sm">
      <div class="flex items-center justify-around">
        <div class="flex flex-col items-center gap-1">
          <span class="text-xs font-bold uppercase text-secondary-foreground/70">Aktuelles Level</span>
          <div class="flex items-center gap-2">
            <Trophy class="w-6 h-6 text-secondary-foreground" />
            <span class="text-2xl font-black text-secondary-foreground">Level {{ homeStore.level }}</span>
          </div>
        </div>

        <div class="h-10 w-[1px] bg-secondary-foreground/20"></div>

        <div class="flex flex-col items-center gap-1">
          <span class="text-xs font-bold uppercase text-secondary-foreground/70">Lernserie</span>
          <div class="flex items-center gap-2">
            <span class="text-2xl font-black text-secondary-foreground">{{ homeStore.flammen }} </span>
            <Flame class="w-6 h-6 text-secondary-foreground fill-secondary-foreground" />
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch flex-grow">
      
      <div class="lg:col-span-2">
        <Card class="h-full border-2 shadow-sm bg-primary-variant">
          <CardContent class="py-4 flex flex-col h-full space-y-8">
            <div class="flex-grow flex flex-col items-center justify-center py-12 bg-white rounded-2xl">
              <span class="text-7xl font-black text-surface-foreground/90">{{ homeStore.punkte }}</span>
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
                <span class="font-bold text-primary-foreground">Noch {{ homeStore.punkteBisNaechstesLevel }} XP</span>
              </div>
              <Progress :model-value="homeStore.progress" class="h-4 bg-primary-foreground/30" style="--primary: white;" />
            </div>
          </CardContent>
        </Card>
      </div>

      <aside class="flex flex-col gap-4 h-full">
        <h2 class="text-sm font-bold text-surface-foreground/70 uppercase tracking-wider px-1">
          Schnellstart Lernsets
        </h2>
        
        <div 
          v-if="homeStore.shortcuts.length > 0" 
          class="flex flex-col gap-4 flex-grow"
        >
          <Button 
            v-for="set in homeStore.shortcuts" 
            :key="set.id"
            variant="secondary"
            class="flex-grow max-h-[200px] min-h-[100px] text-xl font-bold justify-center px-8 border-2 shadow-sm whitespace-normal text-center"
            @click="navigateToLernset(set.id, set.name)"
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