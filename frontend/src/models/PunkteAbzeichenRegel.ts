import type { Abzeichen } from "@/models/Abzeichen"
import type { Konto } from "@/models/Konto"
import type { AbzeichenRegel } from "./AbzeichenRegel"

export class PunkteAbzeichenRegel implements AbzeichenRegel {

  private abzeichen: Abzeichen

  constructor(abzeichen: Abzeichen) {
    this.abzeichen = abzeichen
  }

  pruefe(konto: Konto): boolean {
    return konto.punkte >= this.abzeichen.wert
  }

  getAbzeichen(): Abzeichen {
    return this.abzeichen
  }
}