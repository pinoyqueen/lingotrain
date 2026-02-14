import { defineStore } from 'pinia'
import { createLernset, editLernset, findAllLernsets, deleteLernset } from '@/repositories/LernsetRepository'
import type { Lernset } from '@/models/Lernset'

export const useLernsetStore = defineStore('lernset', {
  state: () => ({
    sets: [] as Lernset[],
    loading: false,
    fehler: "" as String
  }),

  actions: {
    // Lädt alle Lernsets des aktuellen Benutzers
    async loadMySets(kontoId: string, aktuelleSprache: string) {
      this.loading = true
      this.fehler = "";
      try {
        this.sets = await findAllLernsets(kontoId, aktuelleSprache)
      } catch (e: any) {
        this.fehler = "Fehler beim Laden der Lernsets: " + e.message
      } finally {
        this.loading = false
      }
    },

    // Neues Lernset hinzufügen
    async addSet(set: Lernset, aktuelleSprache: string) {
      this.loading = true
      // Neue Set in DB speichern
      await createLernset(set)
      // Liste neu laden
      this.sets = await findAllLernsets(set.ownerId, aktuelleSprache)
      this.loading = false
    }, 

    // bestehendes Lernset bearbeiten
    async editSet(set: Lernset, aktuelleSprache: string) {
      if (!set.id) throw new Error('ID fehlt zum Bearbeiten!')
      await editLernset(set.ownerId, set)
      // Liste neu laden
      this.sets = await findAllLernsets(set.ownerId, aktuelleSprache)
    },

    // Vokabel löschen
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
