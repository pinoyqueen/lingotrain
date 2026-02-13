<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem
} from '@/components/ui/select'

const router = useRouter()
const auth = useAuthStore()

// Beim Laden der Seite Sprachen aus der DB holen
onMounted(async () => {
  await auth.loadVerfuegbareSprachen()
})

/**
 * Erstellt dynamische CSS-Klassen für Eingabefelder.
 * 
 * Setzt den Rahmen auf die primäre Farbe, wenn das Eingabefeld in den Fokus kommt.
 * Bei Fehlern wird der Rahmen stattdessen in einer Warn-Farbe markiert.
 * 
 * @param error Fehlermeldung des jeweiligen Feldes
 * @return Liste der Klassen für das Eingabefeld
 */
function inputClass(error: string | null) {
  return [
    'border rounded-md px-3 py-2 w-full',

    error 
      ? 'border-2 border-[var(--warning)] focus-visible:border-[var(--primary)] focus-visible:ring-[var(--primary)]/60'
      : 'border-gray-300 focus-visible:border-[var(--primary)] focus-visible:ring-[var(--primary)]/60'
  ]
}

/** 
 * Hilfsfunktion, zum Umwandeln der ID der ausgewählten Sprache in das
 * gesamte Sprachen-Objekt, um auch auf den Namen und die Flagge zugreifen
 * zu können (für die Darstellung).
 */
const getSelectedSprache = () => {
  return auth.verfuegbareSprachen.find(s => s.id === auth.registerForm.sprache);
}

/**
 * Führt den Registrierungs-Vorgang aus.
 * 
 * Bei erfolgreicher Registrierung wird zur Startseite weitergeleitet.
 */
async function onRegister() {
  const success = await auth.register()
  if (success) router.push({ name: 'home' })
}
</script>

<template>
  <div class="min-h-screen flex flex-col justify-center items-center px-6 py-12 w-full max-w-xl">
    <!-- Logo -->
    <img src="@/assets/logo.png" alt="Logo" class="w-35 h-35 mb-6" />

    <form class="w-full space-y-4" @submit.prevent="onRegister">

      <!-- Sprache -->
      <div class="space-y-1">
        <Label class="mb-1.5 px-1">Lernsprache</Label>
        <Select v-model="auth.registerForm.sprache">
          <SelectTrigger class="w-full" :class="inputClass(auth.registerErrors.sprache)">
            <div class="flex items-center gap-5">
                <template v-if="auth.registerForm.sprache && getSelectedSprache()">
                  <img
                    :src="getSelectedSprache()?.flagge"
                    class="h-5 w-auto"
                  />
                  <span>{{ getSelectedSprache().sprache }}</span>
                </template>
                <span v-else>Sprache auswählen</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="s in auth.verfuegbareSprachen" :key="s.id" :value="s.id">
              <div class="flex items-center gap-5">
                <img :src="s.flagge || s.flag" class="h-5 w-auto" />
                {{ s.sprache }}
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <p v-if="auth.registerErrors.sprache" class="text-[var(--warning)] text-sm px-1">
          {{ auth.registerErrors.sprache }}
        </p>
      </div>

      <!-- Vorname -->
      <div class="space-y-1">
        <Label class="mb-1.5 px-1">Vorname</Label>
        <Input 
          v-model="auth.registerForm.vorname" 
          placeholder="Vorname" 
          :class="inputClass(auth.registerErrors.vorname)" 
        />
        <p v-if="auth.registerErrors.vorname" class="text-[var(--warning)] text-sm px-1">{{ auth.registerErrors.vorname }}</p>
      </div>

      <!-- Nachname -->
      <div class="space-y-1">
        <Label class="mb-1.5 px-1">Nachname</Label>
        <Input v-model="auth.registerForm.nachname" placeholder="Nachname" :class="inputClass(auth.registerErrors.nachname)" />
        <p v-if="auth.registerErrors.nachname" class="text-[var(--warning)] text-sm px-1">{{ auth.registerErrors.nachname }}</p>
      </div>

      <!-- Email -->
      <div class="space-y-1">
        <Label class="mb-1.5 px-1">E-Mail-Adresse</Label>
        <Input v-model="auth.registerForm.email" type="text" placeholder="E-Mail-Adresse" :class="inputClass(auth.registerErrors.email)" />
        <p v-if="auth.registerErrors.email" class="text-[var(--warning)] text-sm px-1">{{ auth.registerErrors.email }}</p>
      </div>

      <!-- Username -->
      <div class="space-y-1">
        <Label class="mb-1.5 px-1">Benutzername</Label>
        <Input v-model="auth.registerForm.username" placeholder="Benutzername" :class="inputClass(auth.registerErrors.username)" />
        <p v-if="auth.registerErrors.username" class="text-[var(--warning)] text-sm px-1">{{ auth.registerErrors.username }}</p>
      </div>

      <!-- Passwort -->
      <div class="space-y-1">
        <Label class="mb-1.5 px-1">Passwort</Label>
        <Input v-model="auth.registerForm.passwort" type="password" placeholder="Passwort" :class="inputClass(auth.registerErrors.passwort)" />
        <p v-if="auth.registerErrors.passwort" class="text-[var(--warning)] text-sm px-1">{{ auth.registerErrors.passwort }}</p>
      </div>

      <!-- Passwort bestätigen -->
      <div class="space-y-1">
        <Label class="mb-1.5 px-1">Passwort bestätigen</Label>
        <Input v-model="auth.registerForm.passwortConfirm" type="password" placeholder="Passwort bestätigen" :class="inputClass(auth.registerErrors.passwortConfirm)" />
        <p v-if="auth.registerErrors.passwortConfirm" class="text-[var(--warning)] text-sm px-1">{{ auth.registerErrors.passwortConfirm }}</p>
      </div>

      <!-- Global Error -->
      <p v-if="auth.registerErrors.global" class="text-[var(--warning)] text-sm text-center">{{ auth.registerErrors.global }}</p>

      <!-- Submit -->
      <Button variant="primary" type="submit" class="w-full mt-4">Registrieren</Button>
    </form>

    <!-- Login Link -->
    <p class="mt-4 text-primary cursor-pointer hover:opacity-70 text-center" @click="router.push({ name: 'login' })">
      Schon registriert? Zum Login
    </p>
  </div>
</template>
