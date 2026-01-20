// src/stores/lernsetStore.ts
import { defineStore } from 'pinia'
import { createLernset, editLernset, findAllLernsets } from '@/services/LernsetService'
import type { Lernset } from '@/models/Lernset'

export const useLernsetStore = defineStore('lernset', {
  state: () => ({
    sets: [] as Lernset[],
    loading: false
  }),

  actions: {
    async loadMySets(kontoId: string) {
      this.loading = true
      this.sets = await findAllLernsets(kontoId)
      this.loading = false
    },

    async addSet(set: Lernset) {
      this.loading = true
      // Neue Set in DB speichern
      await createLernset(set)
      // Liste neu laden
      this.sets = await findAllLernsets(set.ownerId)
      this.loading = false
    }, 

    async editSet(set: Lernset) {
      if (!set.id) throw new Error('ID fehlt zum Bearbeiten!')
      await editLernset(set.ownerId, set)
      // Liste neu laden
      this.sets = await findAllLernsets(set.ownerId)
    }
  }
})
