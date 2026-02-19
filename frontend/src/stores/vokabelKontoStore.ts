import { defineStore } from 'pinia'
import { getAllVokabelnForTraining,  getAnzahlGelernt,  updateStatus } from '@/repositories/VokabelKontoRepository'
import { useKontoStore } from './kontoStore'
import type { Vokabeln } from '@/models/Vokabeln'
import { VOKABELN_STATUS } from '@/models/VokabelnStatus'

export const useVkStore = defineStore('vokabelKonto', {
    state: () => ({
        alleVokabeln: [] as Vokabeln[],
        index: 0,
        rundeFertig: false,
        aktuelleFrage: null as Vokabeln | null,
        anzahlGelerntFuerAktuelleVokabel: 0
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
        },
        async getAnzahlGelernt(vokabelId: string): Promise<number> {
            const kontoId = useKontoStore().aktuellesKonto?.id

            if (!kontoId) {
                return 0
            }

            const result = await getAnzahlGelernt(kontoId, vokabelId)
            console.log("Firestore gelernt:", result)

            return result ?? 0
        },
        getDistractors(richtig: Vokabeln, count: number): Vokabeln[] {
            // Pool erstellen, ohne die richtige Vokabel und nur Wörter
            const pool: Vokabeln[] = this.alleVokabeln.filter((v): v is Vokabeln => v !== undefined && v.isWort && v.id !== richtig.id)

            // Pool mischen
            for (let i = pool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1))
                const temp = pool[i]
                if(pool[j])
                    pool[i] = pool[j]
                if(temp)
                    pool[j] = temp
            }

            console.log("Pool size:", pool.length)

            // gewünschte Anzahl zurückgeben
            return pool.slice(0, count)
        }
        


    }
})