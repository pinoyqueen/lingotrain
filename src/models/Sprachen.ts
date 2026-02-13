/**
 * Repräsentiert eine Sprache, die vom Nutzer gelernt werden kann, in der Anwendung.
 * 
 * Enthält die ID, den Namen der Sprache und einen Link zu einem Bild der Flagge.
 */
export interface Sprachen {
    /** ID der Sprache */
    id?: string;

    /** Name der Sprache */
    sprache: string;

    /** Link / URL zum Bild der Flagge der zugehörigen Sprache */
    flagge: string;
}