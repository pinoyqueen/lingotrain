/**
 * Mögliche Lernstatus-Werte einer Vokabel.
 * 
 * - NICHT_GELERNT: Die Vokabel wurde noch nicht bearbeitet.
 * - FALSCH: Die Vokabel wurde falsch beantwortet.
 * - RICHTIG: Die Vokabel wurde korrekt beantwortet.
 */
export type VokabelnStatus = 'NICHT_GELERNT' | 'FALSCH' | 'RICHTIG'

/**
 * Konstantenobjekt zur typischeren Verwendung der Vokabel-Statuswerte.
 * 
 */
export const VOKABELN_STATUS = {
  NICHT_GELERNT: 'NICHT_GELERNT',
  FALSCH: 'FALSCH',
  RICHTIG: 'RICHTIG',
} as const
