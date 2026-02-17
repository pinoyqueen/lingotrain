export class LevelCalculator {
  private readonly punkteProLevel: number

  constructor(punkteProLevel: number = 1000) {
    this.punkteProLevel = punkteProLevel
  }

  level(punkte: number): number {
    return Math.floor(punkte / this.punkteProLevel) + 1
  }

  punkteImLevel(punkte: number): number {
    return punkte % this.punkteProLevel
  }

  progress(punkte: number): number {
    return (this.punkteImLevel(punkte) * 100) / this.punkteProLevel
  }

  punkteBisNaechstesLevel(punkte: number): number {
    return this.punkteProLevel - this.punkteImLevel(punkte)
  }
}
