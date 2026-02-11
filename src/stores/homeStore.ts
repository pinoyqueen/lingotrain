import { defineStore } from 'pinia'
import { useAuthStore } from './authStore'
import { editAktuelleSprache } from '@/repositories/KontoRepository'
import { findAllLernsets } from '@/repositories/LernsetRepository'
import { getSprachenByIds, getSpracheById } from '@/repositories/SprachenRepository'

// Konstante wie in Java
const PUNKTE_PRO_LEVEL = 1000;

export const useHomeStore = defineStore('home', {
  state: () => ({
    alleLernsets: [] as any[],
    ausgewaehlteSprachen: [] as any[],
    aktuelleSprache: null as any | null,
    loading: false,
    error: "" as string
  }),

  getters: {
    authStore: () => useAuthStore(),
    
    punkte(): number {
      return this.authStore.aktuellesKonto?.punkte || 0;
    },

    // --- Entspricht LevelCalculator.java ---

    level(): number {
      // calculateLevel: (punkte / 1000) + 1
      return Math.floor(this.punkte / PUNKTE_PRO_LEVEL) + 1;
    },

    punkteImAktuellenLevel(): number {
      // punkte % 1000
      return this.punkte % PUNKTE_PRO_LEVEL;
    },

    progress(): number {
      // progressImAktuellenLevel: (punkteImLevel * 100) / 1000
      return (this.punkteImAktuellenLevel * 100) / PUNKTE_PRO_LEVEL;
    },

    punkteBisNaechstesLevel(): number {
      // punkteBisNaechstesLevel: 1000 - punkteImLevel
      return PUNKTE_PRO_LEVEL - this.punkteImAktuellenLevel;
    },

    // --- Restliche Dashboard Getters ---

    name(): string {
      const k = this.authStore.aktuellesKonto;
      return k ? `${k.vorname} ${k.nachname}` : '';
    },
    flammen(): number {
      return this.authStore.aktuellesKonto?.anzTage || 0;
    },
    shortcuts(): any[] {
      return this.alleLernsets.slice(0, 3);
    }
  },

  actions: {
    async loadHomeValues() {
      const konto = this.authStore.aktuellesKonto;

      // Hier prüfen wir auf ALLES, was wir für die API-Calls brauchen
      if (!konto || !konto.id || !konto.aktuelleSpracheId) {
        this.error = "Benutzerdaten unvollständig!";
        return;
      }

      this.loading = true;
      try {
        // Ab hier meckert TS nicht mehr, weil konto.id nicht undefined sein kann
        const [sets, sprachen, aktuelle] = await Promise.all([
          findAllLernsets(konto.id),
          getSprachenByIds(konto.sprachenIds), 
          getSpracheById(konto.aktuelleSpracheId)
        ]);

        this.alleLernsets = sets;
        this.ausgewaehlteSprachen = sprachen;
        this.aktuelleSprache = aktuelle;
      } catch (e: any) {
        this.error = "Fehler beim Laden";
      } finally {
        this.loading = false;
      }
    },

    async updateSprache(neueSpracheId: string | null) {
      const konto = this.authStore.aktuellesKonto;
      if (!konto || !konto.id || neueSpracheId === null) return;

      // Speicher den alten Wert für den Notfall (Rollback)
      const alteSpracheId = konto.aktuelleSpracheId;

      try {
        // SCHRITT 1: Sofortiges UI Update (Optimistisch)
        konto.aktuelleSpracheId = neueSpracheId;
        const gefunden = this.ausgewaehlteSprachen.find(s => String(s.id) === String(neueSpracheId));
        if (gefunden) {
          this.aktuelleSprache = { ...gefunden };
        }

        // SCHRITT 2: Datenbank im Hintergrund (await sorgt dafür, dass wir auf Fehler prüfen können)
        this.loading = true;
        await editAktuelleSprache(konto.id, neueSpracheId);

        // SCHRITT 3: Lernsets laden (hängt von der neuen Sprache ab)
        this.alleLernsets = await findAllLernsets(konto.id);

      } catch (e) {
        console.error("DB Update fehlgeschlagen:", e);
        this.error = "Sprachwechsel konnte nicht gespeichert werden.";
        
        // ROLLBACK: Wenn DB fehlschlägt, setz die UI zurück
        konto.aktuelleSpracheId = alteSpracheId;
        this.aktuelleSprache = this.ausgewaehlteSprachen.find(s => String(s.id) === String(alteSpracheId));
      } finally {
        this.loading = false;
      }
    }
  }
})