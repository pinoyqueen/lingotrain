<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useKontoStore } from "@/stores/kontoStore";
import { LevelCalculator } from "@/models/LevelCalculator";
import { Flame, Trophy } from "lucide-vue-next";
import { useProfilbilderStore } from "@/stores/profilbilderStore";

const kontoStore = useKontoStore()
const profilbilderStore = useProfilbilderStore()
const calculator = new LevelCalculator()

onMounted(async () => {
  await profilbilderStore.loadVerfuegbareProfilbilder();
})

const aktuellesProfilbild = computed(() => {
  const id = kontoStore.aktuellesKonto?.profilbild_id
  if(!id) return null

  const bilder = profilbilderStore.verfuegbareProfilbilder
  const gefunden = bilder.find(p => p.id === id)
  return gefunden?.bildlink || null;
})
const profilName = computed(() => kontoStore.aktuellesKonto?.vorname + " " + kontoStore.aktuellesKonto?.nachname)
const level = computed(() => calculator.level(kontoStore.aktuellesKonto?.punkte!))
const flamme = computed(() =>  kontoStore.aktuellesKonto?.anzTage)
const aktuelleSprache = ref<{ id: string; name: string } | null>(null)
const abzeichen = ref<{ id: string; bildlink: string }[]>([])


</script>

<template>
  <div class="flex flex-col min-h-screen p-4 space-y-4">

    <!-- Profil Container -->
    <div class="flex flex-col p-4 bg-white rounded-lg shadow-md">
      <!-- Oberer Bereich: Profilbild + Name + Level -->
      <div class="flex items-center space-x-4 mb-4">
        <img 
          v-if="aktuellesProfilbild"
          :src="aktuellesProfilbild" 
          class="w-32 h-32 p-0.5 rounded-full object-cover border-4 border-primary/10"
        />
        <div class="flex flex-col">
          <span class="text-lg font-bold">{{ profilName }}</span>
          <div class="flex items-center gap-2">
            <Trophy class="w-6 h-6 text-secondary-foreground" />
            <span class="text-2xl font-black text-secondary-foreground">Level {{ level }}</span>
          </div>
        </div>
      </div>

      <!-- Sprache + Flamme -->
      <div class="flex items-center space-x-4">
        <span>Sprache: {{ aktuelleSprache?.name || 'Unbekannt' }}</span>
        <span class="text-2xl flex items-center"> {{ flamme }} </span>
        <Flame class="w-6 h-6 text-secondary-foreground fill-secondary-foreground" />
      </div>
    </div>

    <!-- Statistik Container -->
    <div class="flex flex-col p-4 bg-secondary text-white rounded-lg shadow-md">
      <span class="text-lg font-bold mb-2">Statistik</span>
    </div>

    <!-- Abzeichen Container -->
    <div class="flex flex-col p-4 bg-secondary text-white rounded-lg shadow-md">
      <span class="text-lg font-bold mb-2">Abzeichen</span>
      <div class="overflow-x-auto">
        <div class="flex space-x-2">
          <div
            v-for="badge in abzeichen"
            :key="badge.id"
            class="w-20 h-20 bg-white rounded-lg flex items-center justify-center"
          >
            <img :src="badge.bildlink" alt="Abzeichen" class="w-16 h-16 object-contain" />
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* Optional: Scrollbar Styling für Abzeichen */
::-webkit-scrollbar {
  height: 6px;
}
::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 3px;
}
</style>