import type { VokabelnStatus } from "./VokabelnStatus"

/**
 * Verknüpft eine Vokabel mit einem Benutzerkonto und speichert den individuellen
 * Lernstatus sowie Lernfortschritt.
 * 
 * Dient zur Nachverfolgung, wie oft und mit welchem Ergebnis eine Vokabel gelernt wurde.
 */
export interface VokabelKonto {
  /** ID der zugehörigen Vokabel */  
  vokabelId: string
  /** ID des Benutzerkontos */
  kontoId: string
  /** Aktueller Lernstatus der Vokabel für dieses Konto */
  status: VokabelnStatus
  /** Anzahl der bisherigen Wiederholungsdurchläufe */
  anzahlGelernt: number
  /** ID des zugehörigen Lernsets */
  lernsetId: string
}