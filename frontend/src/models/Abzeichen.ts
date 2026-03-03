/**
 * Mögliche Typen eines Abzeichens.
 * 
 * - 'PUNKTE': Punkte-basiertes Abzeichen, z.B. 100, 500, 1000, 5000 Punkte.
 * - 'FLAMME': Streak-Abzeichen, z.B. 7 oder 30 aufeinanderfolgende Lerntage.
 * - 'RANKING': Leaderboard-Abzeichen.
 * - 'SPRACHEN': Sprachen-Abzeichen, z.B. 3 gelernter Sprachen.
 */
export type AbzeichenTyp = 'PUNKTE' | 'FLAMME' | 'RANKING' | 'SPRACHEN'

/**
 * Konstantenobjekt zur typischeren Verwendung der Abzeichen-Typwerte.
 * 
 */
export const ABZEICHEN_TYP =  {
  PUNKTE: "PUNKTE",
  FLAMME: "FLAMME",
  RANKING: "RANKING",
  SPRACHEN: "SPRACHEN"
} as const

/**
 * Repräsentiert ein Abzeichen, die einem Nutzer basierend auf Leistung
 * oder Aktivitäten zugewiesen werden kann.
 */
export interface Abzeichen {
  /** Id des Abzeichens */
  id: string
  /** Anzeigename des Abzeichens */
  name: string
  /** Beschreibung des Abzeichens */
  beschreibung: string
  /** Link zum Icon des Abzeichens */
  abzeichenLink: string
  /** Typ des Abzeichens */
  typ: AbzeichenTyp
  /**
   * Numerischer Wert des Abzeichens.
   * Die Bedeutung hängt vom Typ ab:
   * - PUNKTE: Anzahl der erreichten Punkte (100, 500, 1000)
   * - FLAMME: Länge der Streak (7 oder 30 Tagen)
   * - RANKING: Rangposition (1, 2, 3)
   * - SPRACHEN: Anzahl der aktiv gelernten Sprachen (3)
   */
  wert: number
}