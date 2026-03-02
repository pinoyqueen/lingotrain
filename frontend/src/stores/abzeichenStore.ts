import { defineStore } from 'pinia'
import type { AbzeichenRegel } from '@/models/AbzeichenRegel'
import { ABZEICHEN_TYP, type Abzeichen } from '@/models/Abzeichen'
import { findAll } from '@/repositories/AbzeichenRepository'
import { PunkteAbzeichenRegel } from '@/models/PunkteAbzeichenRegel'
import type { Konto } from '@/models/Konto'
import { createAbzeichenPruefErgebnis, type AbzeichenPruefErgebnis } from '@/models/AbzeichenPruefErgebnis'
import { SprachenAbzeichenRegel } from '@/models/SprachenAbzeichenRegel'
import { FlammenAbzeichenRegel } from '@/models/FlammenAbzeichenRegel'

export const useAbzeichenStore = defineStore('abzeichen', {
  state: () => ({
    alleAbzeichen: [] as Abzeichen[],
    regeln: [] as AbzeichenRegel[],
    initialisiert: false

  }),

  actions: {

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

    pruefAbzeichen(konto: Konto): AbzeichenPruefErgebnis {
        const ergebnis = createAbzeichenPruefErgebnis()

        const vorhandeneIds = new Set(konto.abzeichenIds ?? [])

        for (const regel of this.regeln) {
            const badge = regel.getAbzeichen()
            const id = badge.id

            const regelErfuellt = regel.pruefe(konto)
            const istBereitsVorhanden = vorhandeneIds.has(id)

            if (regelErfuellt && !istBereitsVorhanden)
                ergebnis.hinzufuegen.push(badge)

            if (!regelErfuellt && istBereitsVorhanden)
                ergebnis.entfernen.push(badge)
        }

        return ergebnis
    }

  }
})
