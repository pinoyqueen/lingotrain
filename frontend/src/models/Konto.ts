import type { Lernset } from "./Lernset";

/**
 * Repräsentiert ein Benutzerkonto in der Anwendung.
 * 
 * Enthält persönliche Daten, den Lernfortschritt und die Einstellungen.
 */
export interface Konto {

  /** Eindeutige ID des Kontos (z.B. Firebase UID) */
  id?: string;   

  /** Benutzername des Users */
  benutzername: string;

   /** Vorname des Users */
  vorname: string;

   /** Nachname des Users */
  nachname: string;

   /** Email des Users */
  email: string;

  /** ID des Profilbildes, welches der User auswählt */
  profilbild_id: string;     
  
  /** Gibt an, ob Benachrichtigungen aktiviert sind */
  benachrichtigung: boolean;   
  
  /** Anzahl der aufeinanderfolgenden Lerntage */
  anzTage: number;         
  
  /** Aktueller Punktestand des Nutzers */
  punkte: number;        
  
  /** ID der aktuell ausgewählten Lernsprache (wenn null, dann ist keine ausgewählt) */
  aktuelleSpracheId: string | null;

  /** IDs aller vom User belegten Sprachen */
  sprachenIds: string[];

  /** Liste der erhaltenen Abzeichen @todo: TYPE ZU ABZEICHEN ÄNDERN   */
  abzeichenIds: string[];   
  
  /** Alle vom User erstellten Lernsets */
  lernsets: Lernset[];            
  
  /** Datum des letzten Lernens */
  letztesLernen?: Date;

  /** Anzahl der gelernten Vokabeln pro Tag (insgesamt, also egal ob richtig oder falsch beantwortet) */
  vokabelnProTag?: Record<string, number>;
}
