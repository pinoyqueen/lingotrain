import type { Konto } from "@/models/Konto"
import type { Abzeichen } from "@/models/Abzeichen"

/**
 * Definiert eine Regel für ein Abzeichen.
 * 
 * Eine konkrete Implementierung kapselt das zu vergebnde Abzeichen und die Prüf-Logik, 
 * ob ein Konto die Kriterien erfüllt.
 * 
 */
export interface AbzeichenRegel {
  /**
   * Liefert das Abzeichen, das mit dieser Regel verknüpft ist.
   */
  getAbzeichen(): Abzeichen
  /**
   * Prüft, ob das angegebene Konto die Vergabekriterien dieser Regel erfüllt.
   * 
   * @param konto der aktuelle Benutzer
   */
  pruefe(konto: Konto): boolean
}