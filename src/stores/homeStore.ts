import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Importiere deine Services (entsprechend deiner Web-Struktur)
// import { kontoService } from '@/services/kontoService'
// import { sprachenService } from '@/services/sprachenService'

export const useHomeStore = defineStore('home', () => {
  // --- State (entspricht MutableLiveData) ---
  const name = ref('')
  const punkte = ref(0)
  const flammen = ref(0)
  const alleLernsets = ref<any[]>([])
  const aktuelleSpracheId = ref<string | null>(null)
  const ausgewaehlteSprachen = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // --- Getters (entspricht Transformations.map) ---
  
  // Berechnet das Level basierend auf Punkten (Logik aus LevelCalculator)
  const level = computed(() => {
    return Math.floor(punkte.value / 1000) + 1 // Beispiel-Logik
  })

  // Fortschritt im aktuellen Level in Prozent
  const progress = computed(() => {
    return (punkte.value % 1000) / 10 // Beispiel: 1000 XP pro Level
  })

  const punkteBisNaechstesLevel = computed(() => {
    return 1000 - (punkte.value % 1000)
  })

  // Die ersten 3 Lernsets als Shortcuts
  const shortcuts = computed(() => {
    return alleLernsets.value.slice(0, 3)
  })

  // Das Objekt der aktuellen Sprache finden
  const aktuelleSprache = computed(() => {
    return ausgewaehlteSprachen.value.find(s => s.id === aktuelleSpracheId.value) || null
  })

  // --- Actions (entspricht den Methoden im ViewModel) ---

  async function loadHomeValues() {
    loading.value = true
    try {
      // Hier würdest du deinen API-Call/Firebase-Service aufrufen
      // const konto = await kontoService.getAktuellesKonto()
      
      // Mock-Daten zur Veranschaulichung:
      name.value = "Max Mustermann"
      punkte.value = 2450
      flammen.value = 7
      aktuelleSpracheId.value = "1"
      
      await Promise.all([
        loadLernsets(),
        loadSprachen()
      ])
    } catch (e: any) {
      error.value = "Fehler beim Laden der Daten"
    } finally {
      loading.value = false
    }
  }

  async function loadLernsets() {
    // alleLernsets.value = await kontoService.getLernsets()
    alleLernsets.value = [
      { id: '1', name: 'Grundlagen I' },
      { id: '2', name: 'Essen & Trinken' },
      { id: '3', name: 'Reisen' },
      { id: '4', name: 'Tiere' }
    ]
  }

  async function loadSprachen() {
    // Hier würdest du die verfügbaren Sprachen des Nutzers laden
    ausgewaehlteSprachen.value = [
      { id: '1', name: 'Französisch', flagge: 'https://...' },
      { id: '2', name: 'Englisch', flagge: 'https://...' }
    ]
  }

  async function aktuelleSpracheAendern(newId: string) {
    try {
      // await kontoService.updateAktuelleSprache(newId)
      aktuelleSpracheId.value = newId
    } catch (e) {
      error.value = "Sprache konnte nicht geändert werden"
    }
  }

  return {
    name, punkte, flammen, alleLernsets, aktuelleSpracheId, ausgewaehlteSprachen,
    level, progress, punkteBisNaechstesLevel, shortcuts, aktuelleSprache,
    loadHomeValues, aktuelleSpracheAendern
  }
})