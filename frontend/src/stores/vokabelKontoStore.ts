import { defineStore } from 'pinia'
import { getAllVokabelnForTraining,  getAnzahlGelernt,  updateStatus as repoUpdateStatus } from '@/repositories/VokabelKontoRepository'
import { useKontoStore } from './kontoStore'
import type { Vokabeln } from '@/models/Vokabeln'
import { VOKABELN_STATUS, type VokabelnStatus } from '@/models/VokabelnStatus'

/**
 * Pinia-Store zur Verwaltung des Lernfortschritts von vokabeln für das aktuelle Benutzerkonto.
 * 
 * Zuständig für:
 * - Laden der Vokabeln eines Lernsets für Trainingsrunden
 * - Verwaltung der aktuellen Frage und des Rundenfortschritts
 * - Status-Updates und Zählen der gelernten Vokabeln
 * - Generieren von Distraktoren (falsche Antworten) für MC-Fragen oder Paaren
 */
export const useVkStore = defineStore('vokabelKonto', {
    state: () => ({
        /** Alle Vokabeln, die aktuell für das Training geladen wurden */
        alleVokabeln: [] as Vokabeln[],
        /** Index der aktuellen Frage innerhalb von alleVokabeln */
        index: 0,
        /** Flag, ob die aktuelle Trainingsrunde abgeschlossen ist */
        rundeFertig: false,
        /** Aktuell gestellte Frage */
        aktuelleFrage: null as Vokabeln | null,
        /** Anzahl der bisherigen Lernvorgänge für die aktuelle Vokabel */
        anzahlGelerntFuerAktuelleVokabel: 0
    }),
    actions: {
        /**
         * Lädt alle relevanten Vokabeln eines Lernsets für das Training.
         * 
         * Es werden nur Vokabeln mit Status NICHT_GELERNT oder FALSCH berücksichtigt.
         * Nach dem Laden werden die Vokabeln gemischt und die erste Frage gesetzt.
         * 
         * @param lernsetId ID des Lernsets
         */
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
        
        /**
         * Setzt die nächste Frage im Training als aktuelleFrage.
         * Markiert die Runde als fertig, wenn alle Vokabeln durchlaufen wurden.
         */
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

        /**
         * Beantwortet die aktuelle Frage und aktualisiert den Lernstatus.
         * 
         * @param isRichtig true, wenn die Antwort korrekt war, sonst false
         */
        frageBeantwortet(isRichtig: boolean) {
            var status = isRichtig ? VOKABELN_STATUS.RICHTIG : VOKABELN_STATUS.FALSCH
            if (this.aktuelleFrage?.id) {
                this.updateStatus(this.aktuelleFrage?.id, status)
            }
        },

        /**
         * Setzt die Trainingsrunde zurück, ohne neue Vokabeln zu laden.
         * Wird beim Neustart einer Runde verwendet.
         */
        resetRunde() {
            this.rundeFertig = false
            this.aktuelleFrage = null
            this.index = 0
            this.alleVokabeln = []
        },

        /**
         * Liefert die Anzahl, wie oft eine Vokabel vom aktuellen Benutzer erfolgreich gelernt wurde.
         * @param vokabelId ID der Vokabel
         * @returns Promise<number> - Anzahl der Lernvorgänger
         */
        async getAnzahlGelernt(vokabelId: string): Promise<number> {
            const kontoId = useKontoStore().aktuellesKonto?.id

            if (!kontoId) {
                return 0
            }

            const result = await getAnzahlGelernt(kontoId, vokabelId)

            return result ?? 0
        },

        /**
         * Die Methode gibt den Schwierigkeitsgrad zurück, der für die Vokabel möglich ist
         * (z.B. um Sätze zur Vokabel passend zum Können zu generieren).
         * Der Schwierigkeitsgrad basiert dabei auf der Anzahl, wie oft die Vokabel bisher
         * richtig gelernt wurde ({@link getAnzahlGelernt}).
         * 
         * @param {string} vokabelId die ID der Vokabel, dessen Schwierigkeitsgrad bestimmt werden soll
         * @returns {Promise<"einfach" | "mittel" | "schwer">} der Schwierigkeitsgrad
         */
        async getSchwierigkeitsgrad(vokabelId: string): Promise<"einfach" | "mittel" | "schwer"> {
            const anzahlGelernt = await this.getAnzahlGelernt(vokabelId);
            
            if(anzahlGelernt < 5) {
                return "einfach";
            } else if(anzahlGelernt < 10) {
                return "mittel";
            } else {
                return "schwer";
            }
        },

        /**
         * Aktualisiert den Lernstatus einer Vokabel für das aktuelle Konto.
         * 
         * @param vokabelnId Id der Vokabel
         * @param status neuer Status (NICHT_GELERNT, FALSCH, RICHTIG)
         */
        updateStatus(vokabelnId: string, status: VokabelnStatus) {
            const kontoId = useKontoStore().aktuellesKonto?.id
            if (kontoId) {
                repoUpdateStatus(kontoId, vokabelnId, status)
            }
        },

        /**
         * Generiert eine Liste von Distraktoren für MC-Fragen bei MCQSpiel.
         * Schließt die richtige Antwort aus und mischt die Auswahl.
         * 
         * @param richtig Die richtige Vokabel
         * @param count Anzahl der Distraktoren
         * @returns Array von Vokabeln für falsche Antwortmöglichkeiten
         */
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

        /**
         * Generiert eine Mischung von Vokabeln für das PaareSpiel.
         * Entfernt ausgewählten Vokabeln aus der Hauptliste, um Duplikate zu vermeiden.
         * 
         * @param richtig Die aktuelle Vokabel
         * @param count Anzahl der gewünschten Paare
         * @returns Array von Vokabeln für das PaareSpiel
         */
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