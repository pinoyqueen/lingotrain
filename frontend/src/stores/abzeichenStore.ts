import { defineStore } from 'pinia'
import type { AbzeichenRegel } from '@/models/AbzeichenRegel'
import { ABZEICHEN_TYP, type Abzeichen } from '@/models/Abzeichen'
import { findAll } from '@/repositories/AbzeichenRepository'
import { PunkteAbzeichenRegel } from '@/models/PunkteAbzeichenRegel'
import type { Konto } from '@/models/Konto'
import { SprachenAbzeichenRegel } from '@/models/SprachenAbzeichenRegel'
import { FlammenAbzeichenRegel } from '@/models/FlammenAbzeichenRegel'

/**
 * Pinia-Store zur Verwaltung von Abzeichen und deren Vergaberegeln.
 * 
 * Aufgaben:
 * - Abzeichen aus der Datenquelle laden
 * - Aus Abzeichen die passenden Prüfregeln ableiten
 * - Für ein Konto ermitteln, welche Abzeichen hinzugefügt/entfernt werden sollen
 */
export const useAbzeichenStore = defineStore('abzeichen', {
  state: () => ({
    /** Alle geladenen Abzeichen aus der DB */
    alleAbzeichen: [] as Abzeichen[],
    /** Abgeleitete, typ-spezifische Vergaberegeln für die geladenen Abzeichen */
    regeln: [] as AbzeichenRegel[],
    /** Flag, ob die Regeln bereits initialisiert wurden */
    initialisiert: false

  }),

  actions: {

    /**
     * Initialisiert die Abzeichen-Regeln.
     * 
     * Hier werden alle aus dem Repository geladen und für jedes Abzeichen basieren auf
     * dessen Typ werden eine passende Regel abgeleitet.
     * @returns 
     */
    async initRegeln() {
        if (this.initialisiert) return

        this.alleAbzeichen = await findAll()

        this.regeln = []

        for (const a of this.alleAbzeichen) {
            switch(a.typ) {
                case ABZEICHEN_TYP.PUNKTE:
                    this.regeln.push(new PunkteAbzeichenRegel(a))
                    break
                case ABZEICHEN_TYP.SPRACHEN:
                    this.regeln.push(new SprachenAbzeichenRegel(a))
                    break
                case ABZEICHEN_TYP.FLAMME:
                    this.regeln.push(new FlammenAbzeichenRegel(a))
                    break
            }
        }

        this.initialisiert = true
        
    },

    /**
     * Prüft Abzeichen für ein gegebenes Konto und liefert die erforderlichen Änderungen.
     * 
     * Für jede Regel wird geprüft, ob das Konto die Kriterien erfüllt.
     * Wenn erfüllt und das Abzeichen noch nicht vorhanden ist, dann in hinzufuegen.
     * Wenn nicht erfüllt und das Abzeichen bereits vorhanden ist, dann in entfernen.
     * @param konto Das aktuelle Benutzerkonto
     * @returns Liste der Abzeichen, die hinzugefügt werden sollen
     */
    pruefAbzeichen(konto: Konto): Abzeichen[] {
        let neueAbzeichen: Abzeichen[] = []

        const vorhandeneIds = new Set(konto.abzeichenIds ?? [])

        for (const regel of this.regeln) {
            const badge = regel.getAbzeichen()
            const id = badge.id

            const regelErfuellt = regel.pruefe(konto)
            const istBereitsVorhanden = vorhandeneIds.has(id)

            if (regelErfuellt && !istBereitsVorhanden)
                neueAbzeichen.push(badge)
        }

        return neueAbzeichen
    }

  }
})
