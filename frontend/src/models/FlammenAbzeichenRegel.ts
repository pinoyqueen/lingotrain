import type { Abzeichen } from "@/models/Abzeichen"
import type { Konto } from "@/models/Konto"
import type { AbzeichenRegel } from "./AbzeichenRegel"

/**
 * Prüfregel für ein Streak-Abzeichen.
 * 
 * Erfüllt, wenn die Streak eines Kontos (anzTage) mindestens dem im Abzeichen hinterlegten Wert entspricht.
 */
export class FlammenAbzeichenRegel implements AbzeichenRegel {
  /** Das zu prüfenden Abzeichen */
  private abzeichen: Abzeichen

  /**
   * Erstellt eine neue FlammenAbzeichenRegel.
   * @param abzeichen Das Abzeichen, dessen Vergabekriterien geprüft werden.
   */
  constructor(abzeichen: Abzeichen) {
    this.abzeichen = abzeichen
  }

  /**
   * Prüft, ob das Konto die Streak-Bedingung erfüllt.
   * @param konto Konto mit aktuellen Streak-Wert (anzTage)
   * @returns true, wenn die Bedimgung erfüllt ist, andernfalls false
   */
  pruefe(konto: Konto): boolean {
    return konto.anzTage >= this.abzeichen.wert
  }

  /**
   * 
   * @returns Liefert das mit dieser Regel verknüpfte Abzeichen
   */
  getAbzeichen(): Abzeichen {
    return this.abzeichen
  }
}