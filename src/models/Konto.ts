import type { Lernset } from "./Lernset";

export interface Konto {
  id?: string;                    
  benutzername: string;
  vorname: string;
  nachname: string;
  email: string;
  profilbild_id?: string;          
  benachrichtigung: boolean;      
  anzTage: number;               
  punkte: number;                 
  aktuelleSpracheId: string;
  sprachenIds: string[];
  abzeichen: any[];             // TODO: TYPE ZU ABZEICHEN ÄNDERN          
  lernsets: Lernset[];                
}
