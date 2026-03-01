export type AbzeichenTyp = 'PUNKTE' | 'FLAMME' | 'RANKING' | 'SPRACHEN'

export const ABZEICHEN_TYP =  {
  PUNKTE: "PUNKTE",
  FLAMME: "FLAMME",
  RANKING: "RANKING",
  SPRACHEN: "SPRACHEN"
} as const

export interface Abzeichen {
  id: string
  name: string
  beschreibung: string
  abzeichenLink: string
  typ: AbzeichenTyp
  wert: number
}