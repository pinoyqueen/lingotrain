/**
 * Repräsentiert ein Lernset in der Anwendung.
 * 
 * Enthält die grundlegenden Metadaten und Zuordnungsinformationen.
 */
export interface Lernset {
  /** Eindeutige ID des Lernset (optional, z.B. noch nicht gesetzt vor dem Speichern in der DB)*/
  id?: string
  /** Anzeigename des Lernsets */
  name: string
  /** Beschreibung des Inhalts oder Zwecks des Lernsets */
  beschreibung: string
  /** Gibt an, ob das Lernset öffentlich sichtbar ist */
  isPublic: boolean
  /** ID der Zielsprache, auf die sich das Lernset bezieht */
  zielspracheId: string
  /** ID des Benutzers, der das Lernset erstellt hat */
  ownerId: string
}