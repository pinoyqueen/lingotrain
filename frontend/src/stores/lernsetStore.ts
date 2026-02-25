import { defineStore } from 'pinia'
import { createLernset, editLernset, findAllLernsets, deleteLernset } from '@/repositories/LernsetRepository'
import type { Lernset } from '@/models/Lernset'

/**
 * Pinia-Store zur Verwaltung aller Lernsets eines Nutzers.
 * Verantwortlichkeiten:
 * - Lernsets vom Server laden
 * - Erstellen, Aktualisieren, Löschen von Lernsets
 * - Lokale Speicherung & Status-Management (loading, Fehler)

 */
export const useLernsetStore = defineStore('lernset', {
  state: () => ({
    /** Liste aller Lernsets, die dem Nutzer gehören */
    sets: [] as Lernset[],
    /** Ladeindikator für UI-Komponenten */
    loading: false,
    /** Text für Fehlermeldungen */
    fehler: "" as String
  }),

  actions: {
    /**
     * Lädt alle Lernsets des Benutzers für die aktuell gewählte Sprache.
     * 
     * @param kontoId Benutzer-Id
     * @param aktuelleSprache Id der Zielsprache
     */
    async loadMySets(kontoId: string, aktuelleSprache: string) {
      this.loading = true
      this.fehler = "";
      try {
        this.sets = await findAllLernsets(kontoId, aktuelleSprache)
        return this.sets
      } catch (e: any) {
        this.fehler = "Fehler beim Laden der Lernsets: " + e.message
      } finally {
        this.loading = false
      }
    },

    /**
     * Erstellt ein neues Lernset und lädt danach die vollständige Liste neu.
     * 
     * @param set neue Lernset-Objekt
     * @param aktuelleSprache Id der Zielsprache
     */
    async addSet(set: Lernset, aktuelleSprache: string) {
      this.loading = true
      // Lernset in Firestore anlegen
      await createLernset(set)
      // Liste neu laden
      this.sets = await findAllLernsets(set.ownerId, aktuelleSprache)
      this.loading = false
    }, 

    /**
     * Aktualisiert ein bestehendes Lernset in Firestore und lädt die Liste neu.
     * 
     * @param set Lernset mit gültiger Id
     * @param aktuelleSprache Id der Zielsprache
     */
    async editSet(set: Lernset, aktuelleSprache: string) {
      if (!set.id) throw new Error('ID fehlt zum Bearbeiten!')
      await editLernset(set)
      // Liste neu laden
      this.sets = await findAllLernsets(set.ownerId, aktuelleSprache)
    },

    /**
     * Löscht ein Lernset inklusive aller zugehörigen Vokabeln via Repository und
     * entfernt es anschließend auch lokal aus dem Store.
     * 
     * @param l das zu löschende Lernset
     */
    async deleteLernset(l: Lernset) {
      if(!l.id) throw new Error("ID fehlt zum Löschen!")
      this.loading = true
      await deleteLernset(l.id, l.ownerId)
      // lokal sofort entfernen ohne Reload
      this.sets = this.sets.filter(item => item.id !== l.id)
      this.loading = false
    }
  }
})
