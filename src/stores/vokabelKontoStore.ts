import { defineStore } from 'pinia'
import type { VokabelKonto } from '@/models/VokabelKonto'
import { getAllVokabelnForTraining } from '@/repositories/VokabelKontoRepository'
import { useKontoStore } from './kontoStore'
import type { Vokabeln } from '@/models/Vokabeln'

export const useVkStore = defineStore('vokabelKonto', {
    state: () => ({
        alleVokabeln: [] as Vokabeln[],
        index: 0,
        progress: 0,
        rundeFertig: false,
        aktuelleFrage: null as Vokabeln | null,
        // aktuellesSpiel: null as SpielTyp | null
    }),
    actions: {
        async ladeVokabeln(lernsetId: string) {
            const kontoId = useKontoStore().aktuellesKonto?.id
            if (!kontoId) {
                console.log("!kontoid")
                this.alleVokabeln = []
                return
            }
            console.log(kontoId)
            this.alleVokabeln = await getAllVokabelnForTraining(lernsetId, kontoId)
            this.index = 0
            this.rundeFertig = this.alleVokabeln.length === 0
            if (!this.rundeFertig) this.nextFrage()
        },
        nextFrage() {
            if (this.index >= this.alleVokabeln.length) {
                this.rundeFertig = true
                return
            }
            
            const next = this.alleVokabeln[this.index++]

            if (next) {
                this.aktuelleFrage = next
            
            }
        }
    }
})