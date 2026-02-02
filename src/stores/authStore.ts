import { defineStore } from "pinia";
import { reactive, ref, watch } from "vue";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { createKonto, findKontoByUsername } from "@/repositories/KontoRepository"
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
  const registerSubmitted = ref(false);

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

  function resetLoginErrors() {
    Object.keys(loginErrors).forEach(
      k => (loginErrors[k as keyof typeof loginErrors] = null)
    )
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

  async function register(): Promise<boolean> {
    registerSubmitted.value = true;

    if(!validateRegister()) return false;

    try {
      // Prüfen, ob Username verfügbar
      const exists = await findKontoByUsername(registerForm.username);
      if (exists) {
        registerErrors.username = "Benutzername existiert bereits";
        return false;
      }

      // Firebase Auth erstellen
      const userCredential = await createUserWithEmailAndPassword(auth, registerForm.email, registerForm.passwort);
      const user = userCredential.user;
      if (!user) throw new Error("Firebase User null");

      // Konto in DB erstellen
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

      await createKonto(konto);
      aktuellesKonto.value = konto;
      resetRegister();
      return true;

    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        registerErrors.email = "Email existiert bereits";
      } else {
        registerErrors.global = err.message ?? "Unbekannter Fehler";
      }

      return false;
    }
  }

  watch(registerForm, () => {
    if (!registerSubmitted.value) return;
    validateRegister();
  }, { deep: true });

  return {
    loginForm,
    registerForm,
    loginErrors,
    registerErrors,
    aktuellesKonto,
    register
  };
});
