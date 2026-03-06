<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  type ChartData,
  type ChartOptions
} from "chart.js";
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem
} from '@/components/ui/select'
import { useKontoStore } from "@/stores/kontoStore";
import { LevelCalculator } from "@/models/LevelCalculator";
import { Flame, Trophy } from "lucide-vue-next";
import { useProfilbilderStore } from "@/stores/profilbilderStore";
import type { Abzeichen } from "@/models/Abzeichen";

// Chart.js-Komponenten registrieren
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const kontoStore = useKontoStore()
const profilbilderStore = useProfilbilderStore()
const calculator = new LevelCalculator()

onMounted(async () => {
  await profilbilderStore.loadVerfuegbareProfilbilder();
  abzeichen.value = await kontoStore.getAbzeichen()
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
const abzeichen = ref<Abzeichen[]>([])

/**
 * Die gelernten Vokabeln pro Tag für die letzten 7 Tage.
 * 
 * Hier ist ein Array von Objekten mit dem Wochentag als Label und der
 * Anzahl der Vokabeln als Wert. Dabei wird sich allerdings nur auf die
 * letzten 7 Tage beschränkt, da mehr nicht im Säulendiagramm angezeigt werden soll.
 */
const letzte7Tage = computed(() => {
  // Vokabelanzahl pro Tag aus dem KontoStore holen
  const daten = kontoStore.aktuellesKonto?.vokabelnProTag ?? {};

  // Das Array, welches das Ergebnis später enthalten soll
  const result: { label: string; value: number } [] = [];

  for(let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);

    // Datum im Format yyyy-MM-dd holen, wenn keins vorhanden dann ist der Wert für den Tag 0 (dann wurden keine Vokabeln gelernt)
    const key = d.toISOString().slice(0, 10);
    const value = daten[key] ?? 0;

    // der Wochentag soll abgekürzt werden, d.h. Mo, Di, Mi etc.
    const label = d.toLocaleDateString("de-DE", {
      weekday: "short"
    });

    result.push({ label, value });
  }

  return result;
});

/** CSS-Farbe aus dem Tailwind-Theme für die Säulen im Diagramm */
const primaryColor = getComputedStyle(document.documentElement)
  .getPropertyValue('--color-primary')
  .trim()

/**
 * Daten für das Säulendiagramm.
 * 
 * In chartData werden die Daten für das Säulendiagramm vorbereitet.
 * Dabei wird ein Label, die Daten der gelernten Vokabeln pro Tag aus den
 * letzten 7 Tagen (Werte der x-Achse), die Farbe der Säulen und der 
 * Border-Radius für die Säulen gesetzt.
 * Außerdem werden die Wochentage für die x-Achse gesetzt.
 */
const chartData = computed<ChartData<'bar'>>(() => ({
  labels: letzte7Tage.value.map(d => d.label),
  datasets: [
    {
      label: 'Vokabeln pro Tag',
      data: letzte7Tage.value.map(d => d.value),
      backgroundColor: primaryColor,
      borderRadius: 6
    }
  ]
}))

/**
 * Optionen für das Säulendiagramm.
 * 
 * Hier werden Optionen für das Säulendiagramm gesetzt. Dazu zählt, dass es
 * responsiv sein soll und die Höhe über den Container gesteuert wird.
 * Außerdem wird die Legende ausgeblendet, da es nur einen Datensatz gibt und
 * die y-Achse beginnt bei 0.
 */
const chartOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    }
  },
  scales: {
    y: {
      type: 'linear',
      beginAtZero: true
    }
  }
};

</script>

<template>
  <div class="flex flex-col min-h-0 md:h-[calc(100vh-60px)] p-4 space-y-4 bg-background">

    <!-- Profil Container -->
    <div class="flex flex-col p-6 bg-white rounded-xl shadow-md border border-border">
      
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

      <div class="w-full h-px bg-border mb-6"></div>

      <!-- Sprache + Flamme -->
      <div class="flex items-center justify-between">
        
        <div class="flex-1 flex flex-col items-center gap-2">
          
          <!-- Auswahl der aktuellen Sprache aus allen Sprachen, die der Nutzer seinem Konto hinzugefügt hat -->
          <Label class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Lernsprache</Label>
        
          <Select 
            :model-value="kontoStore.aktuellesKonto?.aktuelleSpracheId" 
            :disabled="!kontoStore.aktuelleSprache || kontoStore.ausgewaehlteSprachen.length === 0"
            @update:model-value="(val) => kontoStore.updateAktuelleSprache(String(val))"
          >
            <SelectTrigger class="w-full max-w-[180px] bg-background border-2 shadow-sm h-10 rounded-xl">
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

        <div class="hidden sm:block h-10 w-[1px] bg-border"></div>

        <!-- Lernserie -->
        <div class="flex-1 flex flex-col items-center gap-1">
          <span class="text-[10px] font-bold uppercase text-muted-foreground tracking-widest leading-none">Lernserie</span>
          <div class="flex items-center gap-2 text-secondary-foreground">
            <span class="text-2xl font-black">{{ flamme }}</span>
            <Flame class="w-6 h-6 fill-secondary-foreground" />
          </div>
        </div>
      </div>
    </div>

    <!-- Statistik + Abzeichen -->
    <div class="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
      
      <!-- Statistik -->
      <div class="flex-1 flex flex-col p-6 bg-secondary text-secondary-foreground rounded-xl shadow-sm border border-secondary">
        <span class="text-lg font-bold mb-4">Anzahl gelernter Vokabeln pro Tag (in der letzten Woche)</span>
        <div class="flex-1 min-h-0">
          <Bar
            :data="chartData"
            :options="chartOptions"
            class="w-full h-full"
          />
        </div>
      </div>

      <!-- Abzeichen -->
      <div class="flex-1 flex flex-col p-6 bg-secondary text-secondary-foreground rounded-xl shadow-sm border border-secondary">
        <span class="text-lg font-bold mb-4">Abzeichen</span>
        <div class="flex-1 overflow-y-auto min-h-0">
          <div class="grid grid-cols-2 gap-3">
            <p v-if="abzeichen.length === 0">Keine Abzeichen vorhanden.</p>
            <div
              v-else
              v-for="badge in abzeichen"
              :key="badge.id"
              class="bg-white/80 backdrop-blur-sm rounded-2xl inline-flex flex-col items-center p-3 border border-white/50 shadow-sm shrink-0"
            >
              <!-- Badge Bild -->
              <img
                :src="badge.abzeichenLink"
                alt="Abzeichen"
                class="w-16 h-16 object-contain mb-2"
              />

              <!-- Name -->
              <p
                class="text-sm font-semibold text-center whitespace-nowrap"
                :title="badge.name"
              >
                {{ badge.name }}
              </p>

              <!-- Beschreibung -->
              <p
                class="text-xs text-center text-muted-foreground mt-1"
                :title="badge.beschreibung"
              >
                {{ badge.beschreibung }}
              </p>
            </div>
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