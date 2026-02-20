import { defineStore } from 'pinia'
import { getAllVokabelnForTraining,  getAnzahlGelernt,  updateStatus as repoUpdateStatus } from '@/repositories/VokabelKontoRepository'
import { useKontoStore } from './kontoStore'
import type { Vokabeln } from '@/models/Vokabeln'
import { VOKABELN_STATUS, type VokabelnStatus } from '@/models/VokabelnStatus'

export const useVkStore = defineStore('vokabelKonto', {
    state: () => ({
        alleVokabeln: [] as Vokabeln[],
        index: 0,
        rundeFertig: false,
        aktuelleFrage: null as Vokabeln | null,
        anzahlGelerntFuerAktuelleVokabel: 0
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

             // Mischen
            for (let i = this.alleVokabeln.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1))
                const tmp = this.alleVokabeln[i]
                if(this.alleVokabeln[j])
                    this.alleVokabeln[i] = this.alleVokabeln[j]
                if (tmp)
                    this.alleVokabeln[j] = tmp
            }

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
            if (this.aktuelleFrage?.id) {
                this.updateStatus(this.aktuelleFrage?.id, status)
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
        updateStatus(vokabelnId: string, status: VokabelnStatus) {
            console.log("updateStatus")
            const kontoId = useKontoStore().aktuellesKonto?.id
            if (kontoId) {
                repoUpdateStatus(kontoId, vokabelnId, status)
                console.log("repoUpdateStatus")
            }
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
        },
        getPaare(richtig: Vokabeln, count: number): Vokabeln[] {
            const kandidaten: Vokabeln[] = []

            // richtige immer zuerst rein
            kandidaten.push(richtig)
            const richtigId = richtig.id

            // nur ab aktuellem Index suchen
            for (let i = this.index; i < this.alleVokabeln.length; i++) {
                const v = this.alleVokabeln[i]

                if (!v) continue
                if (!v.isWort) continue
                if (v.id === richtigId) continue

                kandidaten.push(v)
            }

            // Shuffle
            for (let i = kandidaten.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1))
                const temp = kandidaten[i]
                if (kandidaten[j])
                    kandidaten[i] = kandidaten[j]
                if (temp)
                    kandidaten[j] = temp
            }

            console.log("Kandidaten nach Index:", kandidaten.length)

            // so viele wie möglich nehmen
            const take = Math.min(count, kandidaten.length)
            const result = kandidaten.slice(0, take)

            // aus Hauptliste entfernen
            this.alleVokabeln = this.alleVokabeln.filter(v => 
                v && !result.some(r => r.id === v.id)
            )

            if (result.length < count) {
                console.warn(
                    "Nicht genug Wort-Vokabeln für Paare-Spiel. Gefunden:",
                    result.length
                )
            }

            return result
        }
        


    }
})