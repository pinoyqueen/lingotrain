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
  profilbild_id?: string;     
  
  /** Gibt an, ob Benachrichtigungen aktiviert sind */
  benachrichtigung: boolean;   
  
  /** Anzahl der aufeinanderfolgenden Lerntage */
  anzTage: number;         
  
  /** Aktueller Punktestand des Nutzers */
  punkte: number;        
  
  /** ID der aktuell ausgewählten Lernsprache */
  aktuelleSpracheId: string;

  /** IDs aller vom User belegten Sprachen */
  sprachenIds: string[];

  /** Liste der erhaltenen Abzeichen @todo: TYPE ZU ABZEICHEN ÄNDERN   */
  abzeichen: any[];   
  
  /** Alle vom User erstellten Lernsets */
  lernsets: Lernset[];                
}
