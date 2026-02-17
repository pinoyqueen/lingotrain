import { defineStore, storeToRefs } from "pinia";
import { useAuthStore } from "./authStore";
import { addSprache, deleteKonto, editAktuelleSprache, findKontoByUsername, removeSprache, updateKonto } from "@/repositories/KontoRepository";
import type { Konto } from "@/models/Konto";
import { deleteLernset, findAllIdsByKonto, findAllIdsByKontoAndSprache } from "@/repositories/LernsetRepository";
import { getSpracheById, getSprachenByIds } from "@/repositories/SprachenRepository";

/**
 * Konto-Store.
 * 
 * Hier wird das Konto verwaltet, d.h. es gibt Methoden zum:
 *  - Laden der Kontodaten aus der DB
 *  - Hinzufügen und Entfernen einer Sprache
 *  - Aktualisieren der aktuellen Sprache
 *  - Aktualisieren der Kontodaten
 *  - Löschen des Kontos (inkl. der zugehörigen Daten)
 */
export const useKontoStore = defineStore('konto', {
    state: () => {
        const authStore = useAuthStore();
        const { aktuellesKonto } = storeToRefs(authStore);

        return {
            aktuellesKonto,
            ausgewaehlteSprachen: [] as any[],
            aktuelleSprache: null as any | null
        };
    },

    actions: {

        /** 
         * Lädt Sprachen und aktuelle Sprache aus der DB für das Konto.
         */
        async loadSprachenZuKonto() {
            const konto = this.aktuellesKonto;
            if (!konto || !konto.id) return;

            try {
                // Ausgewählte Sprachen und aktuelle Sprache laden
                const sprachenPromise = getSprachenByIds(konto.sprachenIds);  
                const aktuelleSprachePromise = konto.aktuelleSpracheId
                ? getSpracheById(konto.aktuelleSpracheId)
                : Promise.resolve(null);

                const [sprachen, aktuelleSprache] = await Promise.all([sprachenPromise, aktuelleSprachePromise]);

                // State aktualisieren
                this.ausgewaehlteSprachen = sprachen;
                this.aktuelleSprache = aktuelleSprache;
            } catch (e: any) {
                console.error("Fehler beim Laden der Kontowerte:", e);
            }
        },

        /** 
         * Fügt eine Sprache zum Konto hinzu.
         * 
         * Hier wird eine neue Sprache zum Konto des aktuell eingeloggten Nutzers
         * hinzugefügt. Dies wird lokal aber auch in der DB aktualisiert.
         * Außerdem wird die aktuelle Sprache, die der Nutzer zum Lernen ausgewählt hat,
         * auf die neu hinzugefügte Sprache gesetzt.
         * 
         * @param {string} spracheId die ID der Sprache, die hinzugefügt werden soll
         */
        async addSpracheZuKonto(spracheId: string) {
            if (!this.aktuellesKonto || !this.aktuellesKonto.id) return;

            // Aktualisieren der Sprache in der DB
            await addSprache(this.aktuellesKonto.id, spracheId);

            // Auch lokal die Sprache aktualisieren
            if (!this.aktuellesKonto.sprachenIds.includes(spracheId)) {
                this.aktuellesKonto.sprachenIds.push(spracheId);
                this.aktuellesKonto.aktuelleSpracheId = spracheId;
            }
        },

        /** 
         * Entfernt eine Sprache aus dem Konto.
         * 
         * Zunächst werden hier alle Lernsets inkl. der Vokabeln zu der Sprache
         * gelöscht. Anschließend wird die Sprache aus dem Konto des aktuell 
         * eingeloggten Nutzers entfernt. Dies wird lokal aber auch in der DB aktualisiert.
         * 
         * Sollte die zu entfernende Sprache auch die aktuelle Sprache sein, dann 
         * wird die aktuelle Sprache auf die erste im Array der ausgewählten Sprachen
         * gesetzt. Ist keine vorhanden, wird {@code null} gesetzt.
         * 
         * @param {string} spracheId die ID der Sprache, die entfernt werden soll
         */
        async removeSpracheVonKonto(spracheId: string) {
            if (!this.aktuellesKonto || !this.aktuellesKonto.id) return;

            try {
                // Lernsets zu dieser Sprache laden und inkl. Vokabeln löschen
                const lernsetIds = await findAllIdsByKontoAndSprache(this.aktuellesKonto.id, spracheId);
                for (const setId of lernsetIds) {
                    await deleteLernset(setId, this.aktuellesKonto.id);
                }

                const neueListe = this.aktuellesKonto.sprachenIds.filter(id => id !== spracheId);
                let neueAktiveId : string | null;

                // wenn die zu entfernende Sprache die aktuelle ist, wird die aktuelle Sprache neu gesetzt
                if (this.aktuellesKonto.aktuelleSpracheId === spracheId) {
                    neueAktiveId = neueListe[0] ?? null; 
                } else {
                    neueAktiveId = this.aktuellesKonto.aktuelleSpracheId;
                }

                // Aktualisieren der DB
                await removeSprache(this.aktuellesKonto.id, spracheId, neueAktiveId);

                // Lokal aktualisieren
                this.aktuellesKonto.sprachenIds = neueListe;
                this.aktuellesKonto.aktuelleSpracheId = neueAktiveId;

            } catch (error) {
                console.error("Fehler beim Löschen im Store:", error);
            }
        },

        /** 
         * Aktualisiert ausgewählte Felder des aktuellen Konto-Dokuments.
         * 
         * Zunächst wird geprüft, ob in den übergebenen Daten der Benutzername gesetzt ist. Falls
         * ja, wird geprüft, ob der Benutzername schon vergeben ist oder nicht. Wäre er vergeben,
         * wird ein Fehler mit "USERNAME_EXISTS" geworfen.
         * 
         * Anschließend werden die Daten in der DB aktualisiert und danach auch lokal.
         * 
         * @param {Partial<Konto>} data - Die zu aktualisierenden Felder
         */
        async updateKontoData(data: Partial<Konto>): Promise<boolean> {
            if (!this.aktuellesKonto?.id) {
                throw new Error("Kein Benutzer angemeldet");
            };

            try {

                if(data.benutzername && (data.benutzername !== this.aktuellesKonto.benutzername)) {
                    const exists = await findKontoByUsername(data.benutzername);
                    if(exists && (exists.id !== this.aktuellesKonto.id)) {
                        throw new Error("USERNAME_EXISTS");
                    }
                }

                const updatedKonto = {
                    ...this.aktuellesKonto,
                    ...data
                };

                // Aktualisieren der DB
                await updateKonto(this.aktuellesKonto.id, data); 

                this.aktuellesKonto = updatedKonto;
                
                return true;

            } catch (error) {
                console.error("Fehler beim Aktualisieren des Kontos:", error);
                throw error;
            }
        },

        /**
         * Aktualisiert die aktuelle Sprache.
         * 
         * Hier wird die aktuell ausgewählte Sprache des Nutzers lokal
         * und in der DB aktualisiert.
         * 
         * @param neueSpracheId die neue aktuelle Sprache
         */
        async updateAktuelleSprache(neueSpracheId: string | null) {
            const konto = this.aktuellesKonto;
            if (!konto || !konto.id || neueSpracheId === null) return;

            // alte Sprache für ein mögliches Rollback speichern
            const alteSpracheId = konto.aktuelleSpracheId;

            try {
                // Lokale Daten für UI aktualisieren
                konto.aktuelleSpracheId = neueSpracheId;
                const gefunden = this.ausgewaehlteSprachen.find(s => String(s.id) === String(neueSpracheId));
                if (gefunden) {
                    this.aktuelleSprache = { ...gefunden };
                }

                // Datenbank im Hintergrund aktualisieren 
                await editAktuelleSprache(konto.id, neueSpracheId);

            } catch (e) {
                console.error("DB Update fehlgeschlagen:", e);
                
                // Rollback: Wenn DB fehlschlägt, wird die UI zurückgesetzt
                konto.aktuelleSpracheId = alteSpracheId;
                this.aktuelleSprache = this.ausgewaehlteSprachen.find(s => String(s.id) === String(alteSpracheId));
            }
        },

        /**
         * Löschen aller Konto-Daten.
         * 
         * Diese Methode löscht alle Lernsets und die zugehörigen Vokabeln aus der
         * Firestore Datenbank. Anschließend wird auch das Konto-Document des
         * Nutzers aus der Datenbank gelöscht.
         * 
         * @param userId die ID des Kontos, das gelöscht werden soll
         */
        async deleteAllUserData(userId: string) {
            try{
                // Lernsets zu dem Konto laden und inkl. Vokabeln löschen
                const lernsetIds = await findAllIdsByKonto(userId);
                for (const setId of lernsetIds) {
                    await deleteLernset(setId, userId);
                }

                // Konto aus Firestore DB löschen
                await deleteKonto(userId);

            } catch (error) {
                throw error;
            }
        }
    }
});