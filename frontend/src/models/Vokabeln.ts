/**
 * Reprsentiert einen einzelnen Vokabeleintrag innerhalb eines Lernsets.
 * 
 * Enthält die Vokabel, die Übersetzung sowie Zusatzsinformationen zur Erklärung.
 */
export interface Vokabeln {
  /** Eindeutige ID des Vokabeleintrags (optional, z.B. vor dem Speichern noch nicht gesetzt) */
  id?: string
  /** Begriff oder Ausdruck in der Zielsprache (kann Wort oder Satz sein) */
  vokabel: string
  /** Übersetzung auf Deutsch */
  uebersetzung: string
  /** Optinale Beschreibung oder Erklärung */
  beschreibung: string
  /** Kennzeichnet, ob es sich um ein einzelnes Wort (true) oder eine Satz (false) handelt */ 
  isWort: boolean
  /** ID des zugehörigen Lernsets */
  setId: string
}