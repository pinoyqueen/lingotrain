import { defineStore } from "pinia";
import { ref } from "vue";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { createKonto, findKontoByUsername } from "@/repositories/KontoRepository"
import type { Konto } from "@/models/Konto";

export const useKontoStore = defineStore("konto", () => {
  const auth = getAuth();

  const vorname = ref("");
  const nachname = ref("");
  const email = ref("");
  const username = ref("");
  const passwort = ref("");
  const passwortConfirm = ref("");
  const sprache = ref("");

  const errorVorname = ref<string | null>(null);
  const errorNachname = ref<string | null>(null);
  const errorEmail = ref<string | null>(null);
  const errorUsername = ref<string | null>(null);
  const errorPasswort = ref<string | null>(null);
  const errorPasswortConfirm = ref<string | null>(null);
  const errorSprache = ref<string | null>(null);
  const errorGlobal = ref<string | null>(null);

  const aktuellesKonto = ref<Konto | null>(null);

  function resetErrors() {
    errorVorname.value = null;
    errorNachname.value = null;
    errorEmail.value = null;
    errorUsername.value = null;
    errorPasswort.value = null;
    errorPasswortConfirm.value = null;
    errorSprache.value = null;
    errorGlobal.value = null;
  }

  function validateForm(): boolean {
    resetErrors();

    let valid = true;

    if (!vorname.value) { 
        errorVorname.value = "Vorname fehlt";
        console.log("Test"); 
        valid = false; 
    }

    if (!nachname.value) { 
        errorNachname.value = "Nachname fehlt"; 
        valid = false; 
    }

    if (!email.value) { 
        errorEmail.value = "Email fehlt"; 
        valid = false; 
    }

    if (!username.value) { 
        errorUsername.value = "Username fehlt"; 
        valid = false; 
    }

    if (!passwort.value) { 
        errorPasswort.value = "Passwort fehlt"; 
        valid = false; 
    }

    if (passwort.value !== passwortConfirm.value) { 
        errorPasswortConfirm.value = "Passwörter stimmen nicht überein"; 
        valid = false; 
    }

    if (!sprache.value) { 
        errorSprache.value = "Sprache fehlt"; 
        valid = false; 
    }
    
    return valid;
  }

  async function register(): Promise<boolean> {
    if(!validateForm()) return false;

    try {
      // Prüfen, ob Username verfügbar
      const existing = await findKontoByUsername(username.value);
      if (existing) {
        errorUsername.value = "Username existiert bereits";
        return false;
      }

      // Firebase Auth erstellen
      const userCredential = await createUserWithEmailAndPassword(auth, email.value, passwort.value);
      const user = userCredential.user;
      if (!user) throw new Error("Firebase User null");

      // Konto in DB erstellen
      const konto: Konto = {
        id: user.uid,
        benutzername: username.value,
        vorname: vorname.value,
        nachname: nachname.value,
        email: email.value,
        anzTage: 0,
        punkte: 0,
        benachrichtigung: false,
        profilbild_id: "",
        sprachenIds: [sprache.value],
        aktuelleSpracheId: sprache.value,
        lernsets: [],
        abzeichen: []
      };

      await createKonto(konto);
      aktuellesKonto.value = konto;
      return true;

    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        errorEmail.value = "Email existiert bereits";
      } else {
        errorGlobal.value = err.message ?? "Unbekannter Fehler";
      }
      return false;
    }
  }

  return {
    vorname, nachname, email, username, passwort, passwortConfirm, sprache,
    errorVorname, errorNachname, errorEmail, errorUsername, errorPasswort, errorPasswortConfirm, errorSprache, errorGlobal,
    aktuellesKonto,
    register
  };
});
