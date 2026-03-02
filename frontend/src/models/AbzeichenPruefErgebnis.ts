import type { Abzeichen } from "@/models/Abzeichen"

export interface AbzeichenPruefErgebnis {
  hinzufuegen: Abzeichen[]
  entfernen: Abzeichen[]
}

export function createAbzeichenPruefErgebnis(): AbzeichenPruefErgebnis {
  return {
    hinzufuegen: [],
    entfernen: []
  }
}