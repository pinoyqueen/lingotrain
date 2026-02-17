import type { VokabelnStatus } from "./VokabelnStatus"

export interface VokabelKonto {
  vokabelId: string
  kontoId: string
  status: VokabelnStatus
  lernsetId: string
}