import { defineStore, storeToRefs } from "pinia";
import { useAuthStore } from "./authStore";
import { addAbzeichen as repoAddAbzeichen, removeAbzeichen as repoRemoveAbzeichen, addSprache, deleteKonto, editAktuelleSprache, findKontoByUsername, getLetztesLernenById, removeSprache, updateFlammeAndLetztesLernen, updateKonto } from "@/repositories/KontoRepository";
import { findByIds, findAll } from "@/repositories/AbzeichenRepository"
import type { Konto } from "@/models/Konto";
import { deleteLernset, findAllIdsByKonto, findAllIdsByKontoAndSprache } from "@/repositories/LernsetRepository";
import { getSpracheById, getSprachenByIds } from "@/repositories/SprachenRepository";
import type { Abzeichen } from "@/models/Abzeichen";
import type { AbzeichenPruefErgebnis } from "@/models/AbzeichenPruefErgebnis";
import { useAbzeichenStore } from "./abzeichenStore";

/**
 * Konto-Store.
 * 
 * Hier wird das Konto verwaltet, d.h. es gibt Methoden zum:
 *  - Laden der Kontodaten aus der DB
 *  - Hinzufügen und Entfernen einer Sprache
 *  - Hinzufügen von neuen Punkten zum Konto
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
            aktuelleSprache: null as any | null,
            punkteSchonGespeichert: false,
        };
    },

    actions: {

        /** 
         * Lädt Sprachen und aktuelle Sprache aus der DB für das Konto.
         * 
         * Dabei werden die detaillierten Sprach-Objekte mit Flagge und Name geladen.
         * 
         * Außerdem falls Parameter fehlen, werden die Werte automatisch aus dem
         * aktuellen Konto-State {@link #aktuellesKonto} verwendet. Dadurch kommt es
         * zu keiner Race Condition beim Start der Seite.
         * 
         * @param {string} kontoId die ID des Kontos
         * @param {string[]} sprachenIds Liste der Sprachen, die der Nutzer ausgewählt hat
         * @param {string} aktuelleSpracheId ID der aktuell aktiven Sprache im Konto
         */
        async loadSprachenZuKonto(kontoId?: string, sprachenIds?: string[], aktuelleSpracheId?: string) {
            
            // Fallback auf den Store-State, falls keine Parameter vom Watcher übergeben wurden
            const id = kontoId || this.aktuellesKonto?.id;
            const sIds = sprachenIds || this.aktuellesKonto?.sprachenIds || [];
            const aId = aktuelleSpracheId || this.aktuellesKonto?.aktuelleSpracheId;

            if (!id) return;

            try {
                // Sprachen aus der DB laden
                const sprachen = await getSprachenByIds(sIds);
                this.ausgewaehlteSprachen = sprachen;

                // das aktuelle Sprach-Objekt suchen
                if (aId) {
                    // erst gucken, ob es schon in den geladenen Sprachen ist
                    const gefunden = sprachen.find(s => String(s.id) === String(aId));
                    if (gefunden) {
                        this.aktuelleSprache = { ...gefunden };
                    } else {
                        // Wenn nicht in der Liste, explizit laden
                        this.aktuelleSprache = await getSpracheById(aId);
                    }
                }
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
         * Hinzufügen von Punkten zu den bereits vorhandenen.
         * 
         * @param punkte die neu hinzuzufügenden Punkte
         */
        async addPunkteZuKonto(punkte: number) {
            if(!this.aktuellesKonto?.id) return;
            if(punkte <= 0) return;
            if (this.punkteSchonGespeichert) return;

            const aktuellePunkte = this.aktuellesKonto.punkte ?? 0
            const neuePunkte = aktuellePunkte + punkte

            await this.updateKontoData({
                punkte: neuePunkte
            });

            this.punkteSchonGespeichert = true;
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
        },

        /**
         * Prüft, ob das Konto heute schon gelernt hat, und aktualisiert die Flamme (anzTage) entsprechend.
         */
        async updateFlamme() {
            if (!this.aktuellesKonto || !this.aktuellesKonto.id) return

            const kontoId = this.aktuellesKonto.id

            try {
                const letztesLernen = await getLetztesLernenById(kontoId)

                const heute = new Date()
                heute.setHours(0,0,0,0) // Uhrzeit entfernen

                // Noch nie gelernt -> Flamme starten
                if (!letztesLernen) {
                    await updateFlammeAndLetztesLernen(kontoId, false)
                    this.aktuellesKonto.anzTage = 1
                    return;
                }

                // Tagesberechnung
                const letztesDatum = new Date(letztesLernen)
                letztesDatum.setHours(0,0,0,0) // Uhrzeit entfernen

                const tageDifferenz = Math.floor(
                    (heute.getTime() - letztesDatum.getTime()) / (1000 * 60 * 60 * 24)
                )

                if (tageDifferenz >= 1) {
                    // Gestern gelernt -> Flamme +1
                    await updateFlammeAndLetztesLernen(kontoId, false)
                    this.aktuellesKonto.anzTage = (this.aktuellesKonto.anzTage ?? 0) + 1
                    await this.checkAbzeichen()

                } else {
                    // Heute schon gelernt -> nichts machen
                }

            } catch (error) {
                console.error("Fehler beim Aktualisieren der Flamme:", error)
            }
        },

        async checkFlamme() {
            if (!this.aktuellesKonto?.id) return;

            try {
                const letztesLernen = await getLetztesLernenById(this.aktuellesKonto.id);
                if (!letztesLernen) return;

                const heute = new Date();
                heute.setHours(0,0,0,0);

                const letztesDatum = new Date(letztesLernen);
                letztesDatum.setHours(0,0,0,0);

                const tageDifferenz = Math.floor(
                    (heute.getTime() - letztesDatum.getTime()) / (1000*60*60*24)
                );

                if (tageDifferenz > 1) {
                    // Mehr als 1 Tag Pause -> Reset auf 1
                    await updateFlammeAndLetztesLernen(this.aktuellesKonto.id, true)
                    this.aktuellesKonto.anzTage = 0

                    await this.checkAbzeichen()
                }

            } catch (error) {
                console.error("Fehler beim Prüfen der Streak:", error);
            }
        },

        /**
         * Fügt einem Konto ein Abzeichen hinzu
         */
        async addAbzeichen(abzeichen: Abzeichen): Promise<void> {

            if (!this.aktuellesKonto || !abzeichen || !abzeichen.id) {
                throw new Error("Konto oder Abzeichen ungültig")
            }

            if (!this.aktuellesKonto.abzeichenIds) {
                this.aktuellesKonto.abzeichenIds = []
            }
            
            if (this.aktuellesKonto.id)
                await repoAddAbzeichen(this.aktuellesKonto.id, abzeichen.id)

            // Lokal aktualisieren
            if (!this.aktuellesKonto.abzeichenIds.includes(abzeichen.id)) {
                this.aktuellesKonto.abzeichenIds.push(abzeichen.id)
            }
        },

        /**
         * Entfernt ein Abzeichen von einem Konto
         */
        async removeAbzeichen(abzeichen: Abzeichen): Promise<void> {

            if ( !this.aktuellesKonto || !abzeichen || !abzeichen.id
            ) {
                throw new Error("Konto oder Abzeichen ungültig")
            }

            if (!this.aktuellesKonto.abzeichenIds) {
             this.aktuellesKonto.abzeichenIds = []
            }
            
            if (this.aktuellesKonto.id)
                await repoRemoveAbzeichen(this.aktuellesKonto.id, abzeichen.id)

            // Lokal aktualisieren
            this.aktuellesKonto.abzeichenIds =
            this.aktuellesKonto.abzeichenIds.filter(id => id !== abzeichen.id)
        },

        /**
         * Lädt alle Abzeichen des aktuellen Kontos
         */
        async getAbzeichen(): Promise<Abzeichen[]> {

            if (!this.aktuellesKonto?.abzeichenIds) {
                return []
            }

            const ids = this.aktuellesKonto.abzeichenIds

            if (ids.length === 0) {
                return []
            }

            return await findByIds(ids)
        },

        /**
         * Lädt alle existierenden Abzeichen aus der DB
         */
        async getAlleAbzeichen(): Promise<Abzeichen[]> {
            return await findAll()
        },

        async checkAbzeichen() {
            if (!this.aktuellesKonto) return
            console.log("checkAbzeichen")
            const abzeichenStore = useAbzeichenStore()

            // sicherstellen, dass Regeln geladen sind
            await abzeichenStore.initRegeln()

            const ergebnis = abzeichenStore.pruefAbzeichen(this.aktuellesKonto)

            // neue Abzeichen hinzufügen
            for (const a of ergebnis.hinzufuegen) {
                await this.addAbzeichen(a)
                console.log("Neues Abzeichen: " + a.name)
            }

            // Abzeichen entfernen
            for (const a of ergebnis.entfernen) {
                await this.removeAbzeichen(a)
                console.log("Abzeichen entfernt: " + a.name)
            }
        }



    }
});