import { defineStore } from "pinia";
import { reactive, ref, watch } from "vue";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth";
import { createKonto, findKontoById, findKontoByUsername } from "@/repositories/KontoRepository"
import type { Konto } from "@/models/Konto";

export const useAuthStore = defineStore("auth", () => {
  const auth = getAuth();

  /*
   *  Formulare
   */
  const registerForm = reactive({
    vorname: "",
    nachname: "", 
    email: "",
    username: "",
    passwort: "",
    passwortConfirm: "",
    sprache: ""
  });

  const loginForm = reactive({
    email: "",
    passwort: "",
  });

  /*
   *  Fehler
   */
  const registerErrors = reactive({
    vorname: null as string | null,
    nachname: null as string | null, 
    email: null as string | null,
    username: null as string | null,
    passwort: null as string | null,
    passwortConfirm: null as string | null,
    sprache: null as string | null,
    global: null as string | null
  });

  const loginErrors = reactive({
    email: null as string | null,
    passwort: null as string | null,
    global: null as string | null
  });

  const aktuellesKonto = ref<Konto | null>(null);
  const authReady = ref(false); // Flag, ob Firebase Auth geladen ist

  const registerSubmitted = ref(false);
  const loginSubmitted = ref(false);

  function resetRegister() {
    Object.assign(registerForm, {
      vorname: "",
      nachname: "",
      email: "",
      username: "",
      passwort: "",
      passwortConfirm: "",
      sprache: ""
    });

    Object.keys(registerErrors).forEach(
      k => (registerErrors[k as keyof typeof registerErrors] = null)
    );

    registerSubmitted.value = false;
  }

  function resetLogin() {
    Object.assign(loginForm, {
      email: "",
      passwort: ""
    });

    Object.keys(loginErrors).forEach(
      k => (loginErrors[k as keyof typeof loginErrors] = null)
    );

    loginSubmitted.value = true;
  }

  function validateRequiredInputs(value: string, msg: string) {
    if(!value.trim())
      return msg;

    return "";
  }

  function validateEmail(email: string) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if(!email) return "Email fehlt";
    if(!regex.test(email)) return "Ungültige Email";

    return "";
  }

  function validatePassword(password: string) {
    if(!password) return "Passwort fehlt";
    if(password.length < 6) return "Passwort benötigt mind. 6 Zeichen";

    return "";
  }

  function validateRegister(): boolean {

    registerErrors.sprache = validateRequiredInputs(registerForm.sprache, "Bitte eine Sprache auswählen");
    registerErrors.vorname = validateRequiredInputs(registerForm.vorname, "Vorname fehlt");
    registerErrors.nachname = validateRequiredInputs(registerForm.nachname, "Nachname fehlt");
    registerErrors.username = validateRequiredInputs(registerForm.username, "Benutzername fehlt");
    
    registerErrors.email = validateEmail(registerForm.email);
    registerErrors.passwort = validatePassword(registerForm.passwort);

    registerErrors.passwortConfirm = 
      registerForm.passwort !== registerForm.passwortConfirm
        ? "Stimmt nicht überein"
        : "";

    return !Object.values(registerErrors).some(e => e);
  }

  function validateLogin(): boolean {

    loginErrors.email = validateRequiredInputs(loginForm.email, "Email fehlt");
    loginErrors.passwort = validateRequiredInputs(loginForm.passwort, "Passwort fehlt");

    return !loginErrors.email && !loginErrors.passwort;
  }

  async function register(): Promise<boolean> {
    registerSubmitted.value = true;
    registerErrors.global = null;

    if (!validateRegister()) return false;

    try {
      // Firebase Auth User erstellen
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        registerForm.email,
        registerForm.passwort
      );
      const user = userCredential.user;
      if (!user) throw new Error("Firebase User null");

      console.log("Firebase User erstellt:", user.uid);

      // Firestore-Aufruf kann jetzt erfolgen, Auth ist gesetzt
      const exists = await findKontoByUsername(registerForm.username);
      if (exists) {
        registerErrors.username = "Benutzername existiert bereits";
        // Rollback: Firebase Auth User löschen
        if (auth.currentUser) await auth.currentUser.delete();
        return false;
      }

      // Konto-Objekt erstellen
      const konto: Konto = {
        id: user.uid,
        benutzername: registerForm.username,
        vorname: registerForm.vorname,
        nachname: registerForm.nachname,
        email: registerForm.email,
        anzTage: 0,
        punkte: 0,
        benachrichtigung: false,
        profilbild_id: "",
        sprachenIds: [registerForm.sprache],
        aktuelleSpracheId: registerForm.sprache,
        lernsets: [],
        abzeichen: []
      };

      // Firestore schreiben
      await createKonto(konto);

      // Store aktualisieren & Formular zurücksetzen
      aktuellesKonto.value = konto;
      resetRegister();
      return true;

    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        registerErrors.email = "Email existiert bereits";
      } else if (err.code === "permission-denied") {
        registerErrors.global = "Keine Berechtigung, Konto anzulegen. Prüfe Firestore-Regeln.";
      } else {
        registerErrors.global = err.message ?? "Unbekannter Fehler";
      }

      // Rollback: Firebase User löschen
      if (auth.currentUser) await auth.currentUser.delete();

      return false;
    }
  }

  async function login(stayLoggedIn: boolean): Promise<boolean> {
    loginSubmitted.value = true;

    loginErrors.global = null;
    if (!validateLogin()) return false;

    try {
      await setPersistence(auth, stayLoggedIn ? browserLocalPersistence : browserSessionPersistence);

      const userCredential = await signInWithEmailAndPassword(auth, loginForm.email, loginForm.passwort);
      aktuellesKonto.value = await findKontoById(userCredential.user.uid);
      resetLogin();
      return true;

    } catch (err: any) {
      loginErrors.global = "Die Email oder das Passwort ist falsch";
      return false;
    }
  }

  watch(registerForm, () => {
    if (!registerSubmitted.value) return;
    validateRegister();
  }, { deep: true });

  watch(loginForm, () => {
    if (!loginSubmitted.value) return;
    validateLogin();
  }, { deep: true });

  return {
    loginForm,
    registerForm,
    loginErrors,
    registerErrors,
    aktuellesKonto,
    authReady,
    register,
    login
  };
});
