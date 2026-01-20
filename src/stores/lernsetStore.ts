// src/stores/lernsetStore.ts
import { defineStore } from 'pinia'
import { findAllLernsets } from '@/services/LernsetService'
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
    }
  }
})
