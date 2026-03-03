import type { Abzeichen } from "@/models/Abzeichen"

/**
 * Ergebnis einer Abzeichenprüfung.
 * Enthält die Differenz zwischen aktuellem und gewünschtem Abzeichenstand.
 */
export interface AbzeichenPruefErgebnis {
  /** Abzeichen, die dem Konto nach der Prüfung hinzugefügt werden sollen. */
  hinzufuegen: Abzeichen[]
  /** Abzeichen, die dem Konto nach der Prüfung entfernt werden sollen. */
  entfernen: Abzeichen[]
}

/**
 * Erzeugt ein leeres, initiales AbzeichenPruefErgebnis.
 * 
 * @returns ein neues Ergebnisobjekt mit leeren Listen für hinzufuegen und entfernen
 */
export function createAbzeichenPruefErgebnis(): AbzeichenPruefErgebnis {
  return {
    hinzufuegen: [],
    entfernen: []
  }
}