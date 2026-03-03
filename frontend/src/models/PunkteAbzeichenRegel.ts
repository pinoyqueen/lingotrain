import type { Abzeichen } from "@/models/Abzeichen"
import type { Konto } from "@/models/Konto"
import type { AbzeichenRegel } from "./AbzeichenRegel"

/**
 * Prüfregel für ein Punkte-Abzeichen.
 * 
 * Erfüllt, wenn die Punkte eines Kontos (punkte) mindestens dem im Abzeichen hinterlegten Wert entsprechen.
 */
export class PunkteAbzeichenRegel implements AbzeichenRegel {
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
   * Prüft, ob das Konto die Punkte-Bedingung erfüllt.
   * @param konto Konto mit aktuellen Punkte-Wert (punkte)
   * @returns true, wenn die Bedimgung erfüllt ist, andernfalls false
   */
  pruefe(konto: Konto): boolean {
    return konto.punkte >= this.abzeichen.wert
  }

  /**
   * 
   * @returns Liefert das mit dieser Regel verknüpfte Abzeichen
   */
  getAbzeichen(): Abzeichen {
    return this.abzeichen
  }
}