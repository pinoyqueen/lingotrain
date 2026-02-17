<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useAuthStore } from '@/stores/authStore'
import { useKontoStore } from '@/stores/kontoStore'
import { toast } from 'vue-sonner'
import router from '@/router'

const authStore = useAuthStore();
const kontoStore = useKontoStore();

/** Formulardaten für die Kontobearbeitung */
const form = reactive({
  vorname: '',
  nachname: '',
  email: '',
  username: '',
  aktuellesPasswort: '',
  neuesPasswort: '',
  bestaetigungPasswort: ''
})

/** Fehlermeldungen für die einzelnen Eingabefelder */
const errors = reactive({
  vorname: null as string | null,
  nachname: null as string | null,
  email: null as string | null,
  username: null as string | null,
  aktuellesPasswort: null as string | null,
  neuesPasswort: null as string | null,
  bestaetigungPasswort: null as string | null
})

/** Das eingegebene Passwort beim Löschen des Kontos */
const loeschPasswort = ref('')

/** Die Fehlermeldung für die Eingabe des Passworts beim Löschen des Kontos */
const loeschError = ref<string | null>(null)

/** Sollen die Änderungen gespeichert werden? */
const isSubmitted = ref(false)

// Überwacht Änderungen am Formular, damit Echtzeit-Feedback nach erstem submitten möglich ist
watch(form, () => {
  if (!isSubmitted.value) return;
  validateInputs();
}, { deep: true });

// Laden der initialen Daten in das Formular
onMounted(() => {
  const konto = authStore.aktuellesKonto;
  if(konto) {
    form.vorname = konto.vorname;
    form.nachname = konto.nachname;
    form.username = konto.benutzername;
    form.email = konto.email;
  }
})

/**
 * Erstellt dynamische CSS-Klassen für Eingabefelder.
 * 
 * Setzt den Rahmen auf die primäre Farbe, wenn das Eingabefeld in den Fokus kommt.
 * Bei Fehlern wird der Rahmen stattdessen in einer Warn-Farbe markiert.
 * 
 * @param {string | null} error Fehlermeldung des jeweiligen Feldes
 * @return Liste der Klassen für das Eingabefeld
 */
function inputClass(error: string | null) {
  return [
    'border rounded-md px-3 py-2 w-full transition-all',
    error 
      ? 'border-2 border-[var(--warning)] focus-visible:border-[var(--primary)] focus-visible:ring-[var(--primary)]/60'
      : 'border-gray-300 focus-visible:border-[var(--primary)] focus-visible:ring-[var(--primary)]/60'
  ]
}

/**
 * Validiert die Benutzereingaben.
 * 
 * Dabei werden die Pflichtfelder und das E-Mail-Format geprüft
 * sowie ggf. die Passwort-Logik (falls in einem Feld etwas eingegeben wurde).
 * 
 * @returns {boolean} True, wenn alle Eingaben gültig sind
 */
function validateInputs(): boolean {
  errors.vorname = authStore.validateRequiredInputs(form.vorname, "Vorname fehlt");
  errors.nachname = authStore.validateRequiredInputs(form.nachname, "Nachname fehlt");
  errors.username = authStore.validateRequiredInputs(form.username, "Benutzername fehlt");
  
  errors.email = authStore.validateEmail(form.email);
  
  // Passwort nur validieren, wenn eins der Felder ausgefüllt ist
  if(wantsPasswordChange()) {
    
    errors.aktuellesPasswort = authStore.validateRequiredInputs(form.aktuellesPasswort, "Aktuelles Passwort fehlt");
    errors.neuesPasswort = authStore.validatePassword(form.neuesPasswort);
    
    errors.bestaetigungPasswort = 
    form.neuesPasswort !== form.bestaetigungPasswort
      ? "Stimmt nicht überein"
      : null;
  }

  return !Object.values(errors).some(e => e);
}

/**
 * Prüft, ob die E-Mail im Formular von der aktuell gespeicherten abweicht und
 * demnach aktualisiert werden soll.
 * 
 * @param {string} neueEmail die neue Email
 * @returns {boolean} True, wenn die Email geändert werden soll
 */
function isEmailChanged(neueEmail: string): boolean {
  const aktuellesKonto = kontoStore.aktuellesKonto;

  return (neueEmail !== null) && !(neueEmail === aktuellesKonto?.email);
}

/**
 * Prüft, ob eins der neuen Passwort-Felder Inhalt enthält und das Passwort
 * demnach geändert werden soll.
 * 
 * @returns {boolean} True, wenn das Passwort geändert werden soll
 */
function wantsPasswordChange(): boolean {
  return !!(form.neuesPasswort.trim() ||
            form.bestaetigungPasswort.trim());
}

/**
 * Speichern der Änderungen.
 * 
 * Hier werden die Daten des Nutzers aktualisiert und die Logik aus dem
 * KontoStore für Vorname, Nachname und Benutzername aufgerufen.
 * Für Email- und Passwort-Änderungen wird die Logik aus dem AuthStore
 * aufgerufen, da es kritische Änderungen an der Authentifizierung sind.
 */
async function onSpeichern() {
  isSubmitted.value = true;

  // Errors resetten
  Object.keys(errors).forEach(
      k => (errors[k as keyof typeof errors] = null)
  );

  // Validierung
  if (!validateInputs()) return;

  //Speichern
  try{
    const success = await kontoStore.updateKontoData({
        vorname: form.vorname,
        nachname: form.nachname,
        benutzername: form.username,
    })

    // Falls die Email geändert werden soll, Email ändern
    if (success && isEmailChanged(form.email)) {
      if(!form.aktuellesPasswort) {
        errors.aktuellesPasswort = "Passwort erforderlich";
        return;
      }
      
      await authStore.updateEmailWithAuth(form.email, form.aktuellesPasswort);
      toast.success("Verifizierungs-E-Mail wurde gesendet. Bitte bestätige diese, um deine E-Mail zu ändern.");
      
      // Session beenden, da die Email noch nicht verifiziert ist
      setTimeout(() => { 
        authStore.logout();
        router.push({ name: 'login' });
      }, 3000); // 3 Sekunden Zeit zum Lesen des Toasts geben
    }

    // Falls Passwort geändert werden soll, Passwort ändern
    if (success && wantsPasswordChange()) {
      await authStore.updatePasswordWithAuth(form.aktuellesPasswort, form.neuesPasswort)
    }

    if (success && !isEmailChanged(form.email)) {
      toast.success("Daten erfolgreich aktualisiert")
    } 

  } catch (err: any) {
    if (err.message === "PASSWORD_INCORRECT") {
      errors.aktuellesPasswort = "Das Passwort ist nicht korrekt.";
      toast.error("Authentifizierung fehlgeschlagen.");
    } else if (err.message === "USERNAME_EXISTS") {
      errors.username = "Benutzername bereits vergeben.";
      toast.error("Ändern des Benutzernamen fehlgeschlagen.");
    } else {
      toast.error("Ein unbekannter Fehler ist aufgetreten.");
      console.error(err);
    }
  }
}

/**
 * Löscht das gesamte Benutzerkonto.
 * 
 * Prüft zunächst, ob ein Passwort eingegeben wurde.
 * Falls ja und das Passwort ist richtig, wird die Logik aus dem 
 * AuthStore aufgerufen, um das Konto permanent zu löschen.
 */
async function kontoLoeschen() {
  loeschError.value = null;

  if(!loeschPasswort.value) {
    loeschError.value = "Passwort erforderlich";
    return;
  }

  try {
    await authStore.deleteAccount(loeschPasswort.value);
    toast.success("Dein Konto wurde erfolgreich gelöscht.");

  } catch (err: any) {
    if (err.message === "PASSWORD_INCORRECT") {
      loeschError.value = "Das Passwort ist falsch.";
    } else {
      toast.error("Ein Fehler ist aufgetreten");
    }
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center px-6 py-6 w-full max-w-2xl mx-auto">
    <img src="@/assets/logo.png" alt="Logo" class="w-24 h-24 mb-4" />
    <h2 class="text-xl text-primary font-bold mb-8 text-center">Kontodaten bearbeiten</h2>

    <div class="w-full space-y-6">
      
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <!-- Vorname -->
        <div class="space-y-1">
          <Label class="mb-1.5 px-1">Vorname</Label>
          <Input 
            v-model="form.vorname" 
            :class="inputClass(errors.vorname)" 
          />
          <p v-if="errors.vorname" class="text-[var(--warning)] text-sm px-1">{{ errors.vorname }}</p>
        </div>

        <!-- Nachname -->
        <div class="space-y-1">
          <Label class="mb-1.5 px-1">Nachname</Label>
          <Input v-model="form.nachname" :class="inputClass(errors.nachname)" />
          <p v-if="errors.nachname" class="text-[var(--warning)] text-sm px-1">{{errors.nachname }}</p>
        </div>

      </div>

      <!-- Email -->
      <div class="space-y-1">
        <Label class="mb-1.5 px-1">E-Mail-Adresse</Label>
        <Input v-model="form.email" type="email" :class="inputClass(errors.email)" />
        <p v-if="errors.email" class="text-[var(--warning)] text-sm px-1">{{ errors.email }}</p>
      </div>

      <!-- Benutzername -->
      <div class="space-y-1">
        <Label class="mb-1.5 px-1">Benutzername</Label>
        <Input v-model="form.username" :class="inputClass(errors.username)" />
        <p v-if="errors.username" class="text-[var(--warning)] text-sm px-1">{{ errors.username }}</p>
      </div>

      <div class="relative py-4">
        <div class="absolute inset-0 flex items-center"><span class="w-full border-t border-primary"></span></div>
        <div class="relative flex justify-center text-xs uppercase"><span class="bg-gray-50 px-2 text-primary">Passwort ändern</span></div>
      </div>

      <!-- Aktuelles Passwort -->
      <div class="space-y-1">
        <Label class="mb-1.5 px-1">Aktuelles Passwort</Label>
        <Input v-model="form.aktuellesPasswort" type="password" placeholder="Erforderlich für Email- oder Passwortänderungen" :class="inputClass(errors.aktuellesPasswort)" />
        <p v-if="errors.aktuellesPasswort" class="text-[var(--warning)] text-sm px-1">{{ errors.aktuellesPasswort }}</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <!-- Neues Passwort -->
        <div class="space-y-1">
          <Label class="mb-1.5 px-1">Neues Passwort</Label>
          <Input v-model="form.neuesPasswort" type="password" :class="inputClass(errors.neuesPasswort)" />
          <p v-if="errors.neuesPasswort" class="text-[var(--warning)] text-sm px-1">{{ errors.neuesPasswort }}</p>
        </div>

        <!-- Passwort-Bestäigung -->
        <div class="space-y-1">
          <Label class="mb-1.5 px-1">Bestätigen</Label>
          <Input v-model="form.bestaetigungPasswort" type="password" :class="inputClass(errors.bestaetigungPasswort)" />
          <p v-if="errors.bestaetigungPasswort" class="text-[var(--warning)] text-sm px-1">{{ errors.bestaetigungPasswort }}</p>
        </div>

      </div>

      <div class="pt-1 space-y-1">

        <!-- Button zum Speichern der Änderungen -->
        <Button variant="primary" class="w-full mt-4" @click="onSpeichern">Änderungen speichern</Button>

        <!-- Button zum Löschen des Kontos, der beim Klick aber einen Alert-Dialog öffnet (zur Bestätigung) -->
        <AlertDialog>
          <AlertDialogTrigger as-child>
            <Button variant="primary" class="w-full mt-4 bg-warning hover:bg-warning/80">Konto dauerhaft löschen</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Konto wirklich löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Diese Aktion kann nicht rückgängig gemacht werden. Bitte gib dein Passwort ein.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div class="py-4">
              <Input type="password" v-model="loeschPasswort" placeholder="Dein Passwort" :class="inputClass(loeschError)"  />
              <p v-if="loeschError" class="text-[var(--warning)] text-sm px-1">{{ loeschError }}</p>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel @click="loeschError = null; loeschPasswort = ''">Abbrechen</AlertDialogCancel>
              
              <!-- Button statt AlertDialogAction, damit es sich bei falscher Passworteingabe nicht direkt schließt -->
              <Button @click="kontoLoeschen" class="bg-warning text-white hover:bg-warning/90">
                Löschen bestätigen
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  </div>
</template>