import { defineStore } from 'pinia'
import { createVokabeln, editVokabeln, findAllVokabelnByLernsetId, deleteVokabel } from '@/repositories/VokabelnRepository'
import type { Vokabeln } from '@/models/Vokabeln'
import { create, deleteVK } from '@/repositories/VokabelKontoRepository'
import { VOKABELN_STATUS } from '@/models/VokabelnStatus'
import { useKontoStore } from './kontoStore'

export const useVokabelnStore = defineStore('vokabeln', {
    state: () => ({
        liste: [] as Vokabeln[],
        loading: false,
        fehler: "" as String
    }),

    actions: {
       // Lädt alle Vokabeln eines Lernsets
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

         // Neue Vokabel hinzufügen
        async addVokabel(v: Vokabeln) {
            if (!v.setId) throw new Error("setId fehlt!")
            this.loading = true
            const vokDocRef = await createVokabeln(v)
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

        // Bestehende Vokabel bearbeiten
        async editVokabel(v: Vokabeln) {
            if (!v.id) throw new Error("ID fehlt zum Bearbeiten!")
            this.loading = true
            await editVokabeln(v)
            // Liste neu laden
            this.liste = await findAllVokabelnByLernsetId(v.setId)
            this.loading = false
        },

         // Vokabel löschen
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