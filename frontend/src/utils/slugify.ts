/**
 * Wandelt einen beliebigen Text in eine URL-freundliche Darstellung um.
 * 
 * - Konvertiert den Text in Kleinbuschstaben
 * - Entfernt führende und nachgestellte Leerzeichen
 * - Ersetzt alle Leerzeichen durch Bindestriche
 * - Wandelt deutsch Umlaute und ß 
 * - Entfernt alle übrigen Zeichen, die nicht a-z, 0-9 oder Bindestriche sind
 * 
 * @param text Der Eingabetext, der in einem Slug umgewandelt werden soll
 * @returns string URL-freundliche, kleingeschriebene Slug-Version des Texts
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[ä]/g, "ae")
    .replace(/[ö]/g, "oe")
    .replace(/[ü]/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9-]/g, "");
}
