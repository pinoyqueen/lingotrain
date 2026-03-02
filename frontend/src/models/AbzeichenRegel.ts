import type { Konto } from "@/models/Konto"
import type { Abzeichen } from "@/models/Abzeichen"

export interface AbzeichenRegel {
  getAbzeichen(): Abzeichen
  pruefe(konto: Konto): boolean
}