import { findAllProfilbilder } from "@/repositories/ProfilbilderRepository";
import { defineStore } from "pinia";

/**
 * Profilbilder-Store.
 * 
 * Hier werden die Profilbilder verwaltet, d.h. es werden Methoden zur Verfügung
 * gestellt, mit denen alle verfügbaren Profilbilder aus der DB geladen werden können.
 */
export const useProfilbilderStore = defineStore('profilbild', {
    state: () => ({
        verfuegbareProfilbilder: [] as any[]
    }),

    actions: {

        /** 
         * Lädt alle verfügbaren Profilbilder aus der DB.
         * 
         * Hier werden alle Profilbilder aus der DB geladen, aus denen der Nutzer auswählen kann.
         */
        async loadVerfuegbareProfilbilder() {
            if (this.verfuegbareProfilbilder.length > 0) return;

            try {
                this.verfuegbareProfilbilder = await findAllProfilbilder();
            } catch (error) {
                console.error("Fehler beim Laden der Profilbilder:", error);
            } 
        }
    }
});