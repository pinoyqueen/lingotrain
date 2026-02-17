import { defineStore } from 'pinia'
import { createVokabeln, editVokabeln, findAllVokabelnByLernsetId, deleteVokabel } from '@/repositories/VokabelnRepository'
import type { Vokabeln } from '@/models/Vokabeln'
import { create, deleteVK } from '@/repositories/VokabelKontoRepository'
import { VOKABELN_STATUS } from '@/models/VokabelnStatus'
import { useKontoStore } from './kontoStore'

/**
 * Pinia-Store zur Verwaltung von Vokabeln innerhalb eines Lernsets.
 *
 * Verantwortlichkeiten:
 * - Laden aller Vokabeln eines Lernsets
 * - Erstellen, Aktualisieren und Löschen von Vokabeln
 * - Synchronisieren des VokabelKonto-Eintrags (Lernstatus pro Nutzer)
 * - Lokales State- und Fehler-Handling

 */
export const useVokabelnStore = defineStore('vokabeln', {
    state: () => ({
        /** Aktuelle Vokabelliste des ausgewählten Lernsets */
        liste: [] as Vokabeln[],
        /** Ladeindikator für UI-Komponenten */
        loading: false,
        /** Text für Fehlermeldung */
        fehler: "" as String
    }),

    actions: {
       
        /**
         * Lädt alle Vokabeln eines Lernsets aus Firestore und setzt sie in den Store.
         *
         * @param lernsetId - ID des Lernsets, dessen Vokabeln geladen werden sollen
         */
        async loadByLernsetId(lernsetId: string) {
            this.loading = true
            this.fehler = ""
            try {
                this.liste = await findAllVokabelnByLernsetId(lernsetId)
            } catch (e: any) {
                this.fehler = "Fehler beim Laden der Vokabeln: " + e.message
            } finally {
                this.loading = false
            }
        }, 

        
        /**
         * Erstellt eine neue Vokabel und legt gleichzeitig einen VokabelKonto-Eintrag
         * für den aktuellen Benutzer an (Status = NICHT_GELERNT).
         * Anschließend wird die Liste für das entsprechende Lernset neu geladen.
         *
         * @param v - Vokabel-Objekt
         *
         * @throws Error - Wenn setId fehlt
         */
        async addVokabel(v: Vokabeln) {
            if (!v.setId) throw new Error("setId fehlt!")
            this.loading = true
            // Vokabel in Firestore anlegen
            const vokDocRef = await createVokabeln(v)
            // VokabelKonto-Eintrag für aktuellen Benutzer anlegen
            const kontoId = useKontoStore().aktuellesKonto?.id
            if (kontoId) {
                await create({
                    vokabelId: vokDocRef.id,
                    kontoId: kontoId,
                    status: VOKABELN_STATUS.NICHT_GELERNT,
                    lernsetId: v.setId
                })
            }
            // Liste neu laden
            this.liste = await findAllVokabelnByLernsetId(v.setId)
            this.loading = false
        },

        
        /**
         * Aktualisiert eine bestehende Vokabel in Firestore und lädt danach die
         * Vokabelliste des zugehörigen Lernsets neu.
         *
         * @param v - Vokabel mit gültiger id und setId
         *
         * @throws Error - Wenn die id fehlt
         */
        async editVokabel(v: Vokabeln) {
            if (!v.id) throw new Error("ID fehlt zum Bearbeiten!")
            this.loading = true
            await editVokabeln(v)
            // Liste neu laden
            this.liste = await findAllVokabelnByLernsetId(v.setId)
            this.loading = false
        },

        
        /**
         * Löscht eine Vokabel aus Firestore und entfernt den dazugehörigen
         * VokabelKonto-Eintrag des aktuellen Benutzers. Anschließend wird
         * die Vokabel lokal aus dem Store entfernt.
         *
         * @param v - Vokabel-Objekt
         *
         * @throws Error - Wenn die id fehlt
         */
        async deleteVokabel(v: Vokabeln) {
            if (!v.id) throw new Error("ID fehlt zum Löschen!")
            this.loading = true
            await deleteVokabel(v.id)
            // bestehendes VokabelKonto auch löschen
            const kontoId = useKontoStore().aktuellesKonto?.id
            if (kontoId) {
                await deleteVK(kontoId, v.id)
            }
            // lokal sofort entfernen ohne Reload
            this.liste = this.liste.filter(item => item.id !== v.id)
            this.loading = false
        }
    }
})