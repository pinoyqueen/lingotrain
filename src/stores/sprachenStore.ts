import { findAllSprachen } from "@/repositories/SprachenRepository";
import { defineStore } from "pinia";

/**
 * Sprachen-Store.
 * 
 * Hier werden die Sprachen verwaltet, d.h. es werden Methoden zur Verfügung
 * gestellt, mit denen z.B. alle verfügbaren Sprachen aus der DB geladen werden können.
 */
export const useSprachenStore = defineStore('sprachen', {
    state: () => ({
        verfuegbareSprachen: [] as any[]
    }),

    actions: {

        /** 
         * Lädt alle verfügbaren Sprachen aus der DB.
         * 
         * Hier werden alle Sprachen aus der DB geladen, die der Nutzer auswählen kann.
         */
        async loadVerfuegbareSprachen() {
            if (this.verfuegbareSprachen.length > 0) return;

            try {
                this.verfuegbareSprachen = await findAllSprachen();
            } catch (error) {
                console.error("Fehler beim Laden der Sprachen:", error);
            } 
        }
    }
});