import { defineStore } from 'pinia'
import type { VokabelKonto } from '@/models/VokabelKonto'
import { getAllVokabelnForTraining,  updateStatus } from '@/repositories/VokabelKontoRepository'
import { useKontoStore } from './kontoStore'
import type { Vokabeln } from '@/models/Vokabeln'
import { VOKABELN_STATUS } from '@/models/VokabelnStatus'

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
        },
        frageBeantwortet(isRichtig: boolean) {
            var status = isRichtig ? VOKABELN_STATUS.RICHTIG : VOKABELN_STATUS.FALSCH
            const kontoId = useKontoStore().aktuellesKonto?.id
            if (kontoId && this.aktuelleFrage?.id) {
                updateStatus(kontoId, this.aktuelleFrage?.id, status)
            }
        },
        resetRunde() {
            this.rundeFertig = false
            this.aktuelleFrage = null
        }
    }
})