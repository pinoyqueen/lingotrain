import { defineStore } from 'pinia'

/** Punkte, die zur Motivation bei abgeschlossener Lernrunde vergeben werden */
const BASIS_PUNKTE_RUNDE = 10;

/** Punkt pro richtigem Wort */
const PUNKT_PRO_WORT = 1;

/** Punkte pro richtigem Satz */
const PUNKT_PRO_SATZ = 2;

/** Punkte, wenn 5 richtige Antworten nacheinander kamen */
const BONUS_5_STREAK = 5;

/** Punkte, wenn 10 richtige Antworten nacheinander kamen */
const BONUS_10_STREAK = 10;

/**
 * Store zur Verwaltung der Punkte innerhalb einer Lernrunde.
 * 
 * Hier werden die Punkte für richtig beantwortete Fragen berechnet,
 * der aktuelle Streak (Anzahl aufeinanderfolgender richtiger Antworten)
 * verfolgt und die Punkte am Ende der Runde ermittelt.
 */
export const usePunkteStore = defineStore('punkte', {
  state: () => ({
    /** Anzahl der Punkte in der aktuellen Runde */
    punkteDieseRunde: 0,     
    
    /** Aktueller Streak (Anzahl richtige nacheinander) */
    aktuellerStreak: 0,

    /** Wurden die Punkte bereits für die Runde berechnet? */
    punkteDerRundeBerechnet: false
  }),

  actions: {

    /**
     * Addiert einzelne Punkte hinzu, ohne dass gleich auch der Streak
     * erhöht / zurückgesetzt werden muss.
     * 
     * Dies ist besonders wichtig, um beim Paare-Modus pro richtigem Paar einzelne
     * Punkte zu vergeben, aber den Streak nur zu erhöhen, wenn auch alles 
     * richtig war.
     * 
     * @param punkte Die Anzahl der Punkte, um die erhöht werden soll
     */
    addPunkte(punkte: number) {
        if(punkte > 0) {
            this.punkteDieseRunde += punkte;
        }
    },

    /**
     * Wird aufgerufen, wenn eine Frage beantwortet wurde.
     * 
     * Bei richtiger Antwort wird der Streak erhöht (und auf 5er / 10er Streak
     * geprüft) sowie die Punkte erhöht.
     * Bei falscher Antwort wird der Streak zurückgesetzt.
     *
     * @param richtig Wurde die Frage richtig beantwortet?
     * @param istWort War die Frage ein Wort?
     * @return 5 oder 10 bei einem Streak, ansonsten 0
     */
    frageBeantwortet(richtig: boolean, istWort: boolean): number {
      let streakEvent = 0;

      if (richtig) {
        this.aktuellerStreak++;

        if(istWort) {
            this.punkteDieseRunde += PUNKT_PRO_WORT;
        } else {
            this.punkteDieseRunde += PUNKT_PRO_SATZ;
        }

        if (this.aktuellerStreak === 5) {
          this.punkteDieseRunde += BONUS_5_STREAK;
          streakEvent = 5;
        } else if (this.aktuellerStreak === 10) {
          this.punkteDieseRunde += BONUS_10_STREAK;
          streakEvent = 10;
        }
      } else {
        this.aktuellerStreak = 0;
      }

      return streakEvent;
    },

    /**
     * Beendet die aktuelle Runde.
     * 
     * Hier werden die endgültigen Punkte der Runde berechnet und zurückgegeben.
     * 
     * Ist die Runde fertig und wurde nicht abgebrochen, erhält der Nutzer einen
     * Bonus als Motivation.
     *
     * @param fertig ist die Runde fertig?
     * @return die endgültige Anzahl an Punkten der Runde
     */
    rundeBeenden(fertig: boolean): number {
      if (this.punkteDerRundeBerechnet) return this.punkteDieseRunde;

      if (fertig) {
        this.punkteDieseRunde += BASIS_PUNKTE_RUNDE;
      }

      this.punkteDerRundeBerechnet = true;

      return this.punkteDieseRunde;
    },

    /**
     * Setzt die Punkte und den Streak für die Runde zurück.
     */
    resetRunde() {
      this.punkteDieseRunde = 0;
      this.aktuellerStreak = 0;
      this.punkteDerRundeBerechnet = false;
    }
  }
})