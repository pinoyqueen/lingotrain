/**
 * Hilfsklasse zur Berechnung vom aktuellen Level und Fortschritt basierend auf den Punkten.
 * 
 * Diese Klasse bietet Methoden, um das Level, die Punkte im aktuellen Level,
 * den Fortschritt in Prozent und die Punkte bis zum nächsten Level zu berechnen.
 * 
 * Ein Level wird nach Erreichen einer festen Punkteanzahl erreicht.
 */
export class LevelCalculator {

  /** Anzahl der Punkte, die für ein Level benötigt werden */
  private readonly punkteProLevel: number

  /** 
   * Konstruktor 
   * 
   * @param {number} punkteProLevel die Anzahl an Punkten, die im Level erreicht werden müssen, bevor man das nächste Level erreicht
   */
  constructor(punkteProLevel: number = 1000) {
    this.punkteProLevel = punkteProLevel
  }

  /**
   * Berechnet des aktuelle Level. Dies basiert auf den insgesamt gesammelten Punkten.
   *
   * @param {number} punkte die Gesamtpunkte eines Nutzers
   * @returns {number} das aktuelle Level (beginnt mit 1)
   */
  level(punkte: number): number {
    return Math.floor(punkte / this.punkteProLevel) + 1
  }

  /**
   * Diese Methode berechnet, wie viele Punkte der Nutzer im aktuellen Level bereits gesammelt hat.
   * 
   * @param {number} punkte die Gesamtpunkte eines Nutzers
   * @returns {number} die Punkte im aktuellen Level
   */
  punkteImLevel(punkte: number): number {
    return punkte % this.punkteProLevel
  }

  /**
   * Diese Methode berechnet den Fortschriit (in Prozent), den der Nutzer im aktuellen Level bereits erreicht hat.
   * 
   * @param {number} punkte die Gesamtpunkte eines Nutzers 
   * @returns {number} Fortschritt im aktuellen Level in Prozent
   */
  progress(punkte: number): number {
    return (this.punkteImLevel(punkte) * 100) / this.punkteProLevel
  }

  /**
   * Diese Methode berechnet, wie viele Punkte der Nutzer noch benötigt,
   * um das nächste Level zu erreichen.
   * 
   * @param {number} punkte die Gesamtpunkte eines Nutzers  
   * @returns {number} die Punkte bis zum nächsten Level
   */
  punkteBisNaechstesLevel(punkte: number): number {
    return this.punkteProLevel - this.punkteImLevel(punkte)
  }
}
