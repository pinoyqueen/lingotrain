import type { Abzeichen } from "@/models/Abzeichen"
import type { Konto } from "@/models/Konto"
import type { AbzeichenRegel } from "./AbzeichenRegel"

/**
 * Prüfregel für ein Sprachen-Abzeichen.
 * 
 * Erfüllt, wenn die Anzahl der vom Konto aktiv gelernten Sprachen mindestends dem im Abzeichen hinterlegten Wert entspricht.
 */
export class SprachenAbzeichenRegel implements AbzeichenRegel {
  /** Das zu prüfenden Abzeichen */
  private abzeichen: Abzeichen

  /**
   * Erstellt eine neue PunkteAbzeichenRegel.
   * @param abzeichen Das Abzeichen, dessen Vergabekriterien geprüft werden.
   */
  constructor(abzeichen: Abzeichen) {
    this.abzeichen = abzeichen
  }

  /**
   * Prüft, ob das Konto die Sprachen-Bedingung erfüllt.
   * @param konto Konto mit Liste der Sprachen-Ids (punkte)
   * @returns true, wenn die Bedimgung erfüllt ist, andernfalls false
   */
  pruefe(konto: Konto): boolean {
    return konto.sprachenIds.length >= this.abzeichen.wert
  }

  /**
   * 
   * @returns Liefert das mit dieser Regel verknüpfte Abzeichen
   */
  getAbzeichen(): Abzeichen {
    return this.abzeichen
  }
}