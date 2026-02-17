import { defineStore } from "pinia";
import { reactive, ref, watch } from "vue";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence, signOut, reload, EmailAuthProvider, reauthenticateWithCredential, verifyBeforeUpdateEmail, updatePassword, deleteUser } from "firebase/auth";
import { createKonto, findKontoById, findKontoByUsername } from "@/repositories/KontoRepository"
import type { Konto } from "@/models/Konto";
import router from "@/router";
import { useProfilbilderStore } from "./profilbilderStore";
import { useKontoStore } from "./kontoStore";

/**
 * Authentifizierungs-Store.
 * 
 * Verwaltet Login, Registrierung, Formularzustände, Fehler und das aktuelle
 * Konto.
 * Außerdem bietet es Methoden, um Email und Passwort des aktuellen Auth-
 * Kontos zu aktualisieren oder das Konto zu löschen.
 * 
 * Es wird Firebase Auth für die Authentifizierung genutzt. Als DB wird
 * Firestore über das {@link KontoRepository} genutzt.
 */
export const useAuthStore = defineStore("auth", () => {
  const auth = getAuth();

  const profilbilderStore = useProfilbilderStore();

  // -----------------------
  // Formulare
  // -----------------------

  /** Registrierungsformular */
  const registerForm = reactive({
    vorname: "",
    nachname: "", 
    email: "",
    username: "",
    passwort: "",
    passwortConfirm: "",
    sprache: "",
    profilbild_id: ""
  });

  /** Loginformular */
  const loginForm = reactive({
    email: "",
    passwort: "",
  });

  // -----------------------
  // Fehlerzustände
  // -----------------------

  /** Fehler für die Registrierung */
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

  /** Fehler für das Login */
  const loginErrors = reactive({
    email: null as string | null,
    passwort: null as string | null,
    global: null as string | null
  });

  // -----------------------
  // Aktuelles Konto & Flags
  // -----------------------

  /** Aktuell eingeloggte Konto */
  const aktuellesKonto = ref<Konto | null>(null);

  /** Flag, ob Firebase Auth geladen ist */
  const authReady = ref(false); 

  /** Flag für Register-Submit */
  const registerSubmitted = ref(false);

  /** Flag für Login-Submit */
  const loginSubmitted = ref(false);

  // -----------------------
  // Formular-Reset-Funktionen
  // -----------------------

  /** Setzt das Registrierungsformular und die Fehler zurück. */
  function resetRegister(): void{
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

  /** Setzt das Loginformular und die Fehler zurück. */
  function resetLogin(): void {
    Object.assign(loginForm, {
      email: "",
      passwort: ""
    });

    Object.keys(loginErrors).forEach(
      k => (loginErrors[k as keyof typeof loginErrors] = null)
    );

    loginSubmitted.value = false;
  }

  // -----------------------
  // Validierung
  // -----------------------

  /** 
   * Prüft, ob ein Pflichtfeld ausgefüllt ist. 
   * 
   * @param {string} value Wert des Feldes
   * @param {string} msg Fehlermeldung, falls das Feld leer ist
   * @returns {string | null} Fehlernachricht oder leer, wenn valid
   */
  function validateRequiredInputs(value: string, msg: string): string | null {
    if(!value.trim())
      return msg;

    return null;
  }

  /** 
   * Prüft, ob eine Email vorhanden ist und im richtigen Format vorliegt.
   * 
   * @param {string} email - Email-Adresse
   * @returns {string | null} Fehlernachricht oder leer, wenn valid 
   */
  function validateEmail(email: string): string | null {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if(!email) return "Email fehlt";
    if(!regex.test(email)) return "Ungültige Email";

    return null;
  }

  /** 
   * Prüft, ob ein Passwort vorhanden ist und in der richtigen Länge vorliegt. 
   * 
   * @param {string} password - Passwort
   * @returns {string | null} Fehlernachricht oder leer, wenn valid
   */
  function validatePassword(password: string): string | null {
    if(!password) return "Passwort fehlt";
    if(password.length < 6) return "Passwort benötigt mind. 6 Zeichen";

    return null;
  }

  /** 
   * Validiert das Registrierungsformular. 
   * 
   * @returns {boolean} true, wenn alle Felder gültig sind; sonst false
   */
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
        : null;

    return !Object.values(registerErrors).some(e => e);
  }

  /** 
   * Validiert das Loginformular. 
   * 
   * @returns {boolean} true, wenn alle Felder gültig sind; sonst false
   */
  function validateLogin(): boolean {

    loginErrors.email = validateRequiredInputs(loginForm.email, "Email fehlt");
    loginErrors.passwort = validateRequiredInputs(loginForm.passwort, "Passwort fehlt");

    return !loginErrors.email && !loginErrors.passwort;
  }

  // -----------------------
  // Registrierung, Login und Logout
  // -----------------------

  /** 
   * Registriert einen neuen Benutzer.
   * 
   * Die Registrierung findet zuerst in Firebase Auth statt. 
   * Anschließend wird auch das Konto in Firestore angelegt, falls der Username
   * noch nicht vergeben ist.
   * Wenn der Username schon vergeben ist, wird auch das Anlegen in Firebase
   * Auth rückgängig gemacht.
   * 
   * @returns {Promise<boolean>} true, wenn Registrierung erfolgreich, sonst false
   */
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

      // Prüfen, ob der Username schon vergeben ist, wenn ja, dann Firebase Auth User wieder löschen
      const exists = await findKontoByUsername(registerForm.username);
      if (exists) {
        registerErrors.username = "Benutzername existiert bereits";

        // Rollback: Firebase Auth User löschen
        if (auth.currentUser) await auth.currentUser.delete();
        return false;
      }

      // Zufälliges Profilbild bei Registrierung auswählen
      const bilder = profilbilderStore.verfuegbareProfilbilder;
      const zufallsId = bilder[Math.floor(Math.random() * bilder.length)].id;

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
        profilbild_id: zufallsId,
        sprachenIds: [registerForm.sprache],
        aktuelleSpracheId: registerForm.sprache,
        lernsets: [],
        abzeichen: []
      };

      // Konto in DB erstellen
      await createKonto(konto);

      // Store aktualisieren & Formular zurücksetzen
      aktuellesKonto.value = konto;
      resetRegister();
      return true;

    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        registerErrors.email = "Email existiert bereits";
      } else {
        registerErrors.global = err.message ?? "Unbekannter Fehler";
      }

      // Rollback: Firebase User löschen
      if (auth.currentUser) await auth.currentUser.delete();

      return false;
    }
  }

  /** 
   * Loggt einen Benutzer ein.
   * 
   * Das Einloggen findet über Firebase Auth statt. Anschließend wird der
   * zugehörige Nutzer aus der DB geladen und als aktuellesKonto gesetzt.
   * Sollte der Nutzer nach dem Login auch beim Schließen der Webseite angemeldet
   * bleiben wollen, so wird auch diese Option über Firebase gesetzt.
   * 
   * @param {boolean} stayLoggedIn - true für dauerhaften Login; ansonsten false
   * @returns {Promise<boolean>} true, wenn Registrierung erfolgreich, sonst false
   */
  async function login(stayLoggedIn: boolean): Promise<boolean> {
    loginSubmitted.value = true;

    loginErrors.global = null;
    if (!validateLogin()) return false;

    try {
      // Nutzer speichern, damit er dauerhaft eingeloggt bleibt, falls er das möchte
      await setPersistence(auth, stayLoggedIn ? browserLocalPersistence : browserSessionPersistence);

      // Nutzer in Firebase Auth einloggen
      const userCredential = await signInWithEmailAndPassword(auth, loginForm.email, loginForm.passwort);
      
      // Konto des Nutzers aus der DB laden
      aktuellesKonto.value = await findKontoById(userCredential.user.uid);
      
      // Prüfen, ob die Email geändert und verifiziert wurde 
      if (aktuellesKonto.value) {
        await handleAuthState(userCredential.user);
      }

      resetLogin();
      return true;

    } catch (err: any) {
      loginErrors.global = "Die Email oder das Passwort ist falsch";
      return false;
    }
  }

  /**
   * Loggt einen Benutzer aus.
   * 
   * Das Ausloggen findet über Firebase Auth statt. Anschließend wird das aktuelle Konto
   * resettet und der Nutzer automatisch zum Login navigiert.
   */
  async function logout() {
    try {
      await signOut(auth);
      aktuellesKonto.value = null;
      router.push({ name: 'login' });

    } catch (error) {
      console.error("Logout fehlgeschlagen", error);
    }
  }

  // -----------------------
  // Verwaltung des Kontos
  // -----------------------

  /**
   * Aktualisieren der Email des aktuell eingeloggten Nutzers.
   * 
   * Diese Methode reauthentifiziert den Nutzer zunächst mithilfe des aktuellen
   * Passworts. 
   * 
   * Anschließend wird versucht, die Email zu ändern. Dafür wird an die neue Email
   * eine Email mit einem Verifizierungslink versendet. Klickt der Nutzer den 
   * Verifizierungslink an, wird die Email in Firebase Auth aktualisiert.
   * 
   * @param neueEmail die neue Email
   * @param passwort das aktuelle Passwort
   */
  async function updateEmailWithAuth(neueEmail: string, passwort: string) {
    await reauthenticate(passwort); 
    await verifyBeforeUpdateEmail(auth.currentUser!, neueEmail); 
  }

  /**
   * Aktualisieren des Passworts des aktuell eingeloggten Nutzers.
   * 
   * Diese Methode reauthentifiziert den Nutzer zunächst mithilfe des aktuellen
   * Passworts. 
   * 
   * Anschließend wird das Passwort auf das neu gewünschte Passwort aktualisiert.
   * 
   * @param aktuellesPasswort das noch aktuelle Passwort des Nutzers
   * @param neuesPasswort das neu gewünschte Passwort des Nutzers
   */
  async function updatePasswordWithAuth(aktuellesPasswort: string, neuesPasswort: string) {
    await reauthenticate(aktuellesPasswort);

    const user = auth.currentUser;
    if (user) {
      await updatePassword(user, neuesPasswort); 
    }
  }

  /**
   * Löschen eines Benutzerkontos.
   * 
   * Diese Methode reauthentifiziert den Nutzer zunächst mithilfe des aktuellen
   * Passworts.
   * 
   * Anschließend werden alle Lernsets des Nutzers, inklusive der Vokabeln gelöscht.
   * Im Anschluss wird das Konto zunächst aus Firestore gelöscht und anschließend
   * wird der Nutzer auch aus Firebase Auth entfernt.
   * 
   * @param passwort das aktuelle Passwort des Nutzers
   */
  async function deleteAccount(passwort: string) {
    const user = auth.currentUser;
    if (!user) throw new Error("Kein User angemeldet");
    const userId = user.uid;

    // Re-Authentifizierung
    await reauthenticate(passwort);

    try {
      // Konto-Daten aus der DB löschen
      const kontoStore = useKontoStore();
      await kontoStore.deleteAllUserData(userId);

      // User aus Firebase Auth löschen
      await deleteUser(user);

      // aktuelles Konto entfernen und zu Login navigieren
      aktuellesKonto.value = null;
      router.push({ name: 'login' });
      
    } catch (error) {
      console.error("Fehler beim endgültigen Löschen:", error);
      throw error;
    }
  }

  // -----------------------
  // Interne Auth-Logik (Hilfsfunktionen)
  // -----------------------

  /**
   * Synchronisiert den Authentifizierungszustand mit der Datenbank.
   * 
   * Diese Methode lädt den aktuellen Status des Nutzers von Firebase Auth neu.
   * Dies ist wichtig, um die Email-Verifizierung nach einer Email-Änderung zu prüfen.
   * Falls die E-Mail im Auth-System verifiziert wurde, aber im Firestore-Konto noch 
   * die alte E-Mail steht, wird das Konto in der Datenbank automatisch aktualisiert.
   * 
   * @param {any} user das Objekt des Firebase-Users
   */
  async function handleAuthState(user: any) {
    if (!user) return;

    try {
      // 1. Status vom Firebase Server neu laden (wichtig für emailVerified)
      await reload(user);

      // 2. Wenn Email verifiziert ist, mit Firestore synchronisieren
      if (user.emailVerified) {
        // Zugriff auf den KontoStore, um die DB-Update-Funktion zu nutzen
        const kontoStore = useKontoStore();
        
        if (aktuellesKonto.value && aktuellesKonto.value.email !== user.email) {
          // Update in Firestore
          await kontoStore.updateKontoData({ email: user.email });
          console.log("Email erfolgreich synchronisiert: ", user.email);
        }
      }
    } catch (error) {
      console.error("Fehler bei handleAuthState Synchronisierung:", error);
    }
  }

  /**
   * Re-Authentifiziert einen Nutzer in Firebase Auth.
   * 
   * Diese Methode dient dazu, den aktuell eingeloggten Nutzer in
   * Firebase Auth neu zu authentifizieren. Dafür ist das aktuelle
   * Passwort nötig.
   * 
   * Ist das Passwort falsch, wird "PASSWORD_INCORRECT" als Fehler geworfen.
   * 
   * @param passwort das aktuelle Passwort des Nutzers 
   */
  async function reauthenticate(passwort: string) {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error("Nicht eingeloggt");
    }

    try {
      const credential = EmailAuthProvider.credential(user.email, passwort);
    
      await reauthenticateWithCredential(user, credential);
      await reload(user);

    } catch (error : any) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw new Error("PASSWORD_INCORRECT");
      }

      throw error;
    }
  }

  // -----------------------
  // Watches
  // -----------------------

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
    validateEmail,
    validatePassword,
    validateRequiredInputs,
    register,
    login,
    logout,
    updateEmailWithAuth,
    updatePasswordWithAuth,
    deleteAccount
  };
});
