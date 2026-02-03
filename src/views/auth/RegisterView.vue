<script setup lang="ts">
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

/**
 * @todo: ersetzen durch DB!
 */
const sprachen = [
  { id: 1, name: 'Französisch', flag: 'https://firebasestorage.googleapis.com/v0/b/lingotrain-6ce70.firebasestorage.app/o/flaggen%2FFlag_of_France.png?alt=media&token=b6845f8d-8723-41d7-b7fd-6c4be8488d1a' },
  { id: 2, name: 'Englisch', flag: 'https://firebasestorage.googleapis.com/v0/b/lingotrain-6ce70.firebasestorage.app/o/flaggen%2FFlag_of_the_United_Kingdom.png?alt=media&token=e63be653-1e4a-4e17-82fb-c63754ec8793' },
  { id: 3, name: 'Spanisch', flag: 'https://firebasestorage.googleapis.com/v0/b/lingotrain-6ce70.firebasestorage.app/o/flaggen%2FFlag_of_Spain.png?alt=media&token=c39b4a69-976a-41e1-bd43-b67b78e3ad95' }
]

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
            <!-- Zeige aktuelle Auswahl mit zugehöriger Flagge -->
            <div class="flex items-center gap-5">
                <img
                    v-if="auth.registerForm.sprache && sprachen.find(s => s.name === auth.registerForm.sprache)"
                    :src="sprachen.find(s => s.name === auth.registerForm.sprache)?.flag"
                    class="h-5 w-auto"
                />
                <span>{{ auth.registerForm.sprache || 'Sprache auswählen' }}</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="s in sprachen" :key="s.id" :value="s.name">
              <div class="flex items-center gap-5">
                <img :src="s.flag" class="h-5 w-auto" />
                {{ s.name }}
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <p v-if="auth.registerErrors.sprache" class="text-[var(--warning)] text-sm px-1">{{ auth.registerErrors.sprache }}</p>
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
      <Button variant="secondary" type="submit" class="w-full mt-4">Registrieren</Button>
    </form>

    <!-- Login Link -->
    <p class="mt-4 text-primary cursor-pointer hover:opacity-70 text-center" @click="router.push({ name: 'login' })">
      Schon registriert? Zum Login
    </p>
  </div>
</template>
