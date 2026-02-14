<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'


const form = reactive({
  vorname: '',
  nachname: '',
  email: '',
  username: '',
  aktuellesPasswort: '',
  neuesPasswort: '',
  bestaetigungPasswort: ''
})

const errors = reactive({
  vorname: null,
  nachname: null,
  email: null,
  username: null,
  passwort: null,
  global: null
})

const loeschPasswort = ref('')

function inputClass(error: string | null) {
  return [
    'border rounded-md px-3 py-2 w-full transition-all',
    error 
      ? 'border-2 border-[var(--warning)] focus-visible:border-[var(--primary)] focus-visible:ring-[var(--primary)]/60'
      : 'border-gray-300 focus-visible:border-[var(--primary)] focus-visible:ring-[var(--primary)]/60'
  ]
}

async function onSpeichern() {
  
}

async function kontoLoeschen() {

}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center px-6 py-6 w-full max-w-2xl mx-auto">
    <img src="@/assets/logo.png" alt="Logo" class="w-24 h-24 mb-4" />
    <h2 class="text-xl text-primary font-bold mb-8 text-center">Kontodaten bearbeiten</h2>

    <div class="w-full space-y-6">
      
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="space-y-1">
          <Label class="mb-1.5 px-1">Vorname</Label>
          <Input v-model="form.vorname" :class="inputClass(errors.vorname)" />
        </div>
        <div class="space-y-1">
          <Label class="mb-1.5 px-1">Nachname</Label>
          <Input v-model="form.nachname" :class="inputClass(errors.nachname)" />
        </div>
      </div>

      <div class="space-y-1">
        <Label class="mb-1.5 px-1">E-Mail-Adresse</Label>
        <Input v-model="form.email" type="email" :class="inputClass(errors.email)" />
      </div>

      <div class="space-y-1">
        <Label class="mb-1.5 px-1">Benutzername</Label>
        <Input v-model="form.username" :class="inputClass(errors.username)" />
      </div>

      <div class="relative py-4">
        <div class="absolute inset-0 flex items-center"><span class="w-full border-t border-primary"></span></div>
        <div class="relative flex justify-center text-xs uppercase"><span class="bg-gray-50 px-2 text-primary">Passwort ändern</span></div>
      </div>

      <div class="space-y-1">
        <Label class="mb-1.5 px-1">Aktuelles Passwort</Label>
        <Input v-model="form.aktuellesPasswort" type="password" placeholder="Erforderlich für Passwortänderungen" :class="inputClass(errors.passwort)" />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="space-y-1">
          <Label class="mb-1.5 px-1">Neues Passwort</Label>
          <Input v-model="form.neuesPasswort" type="password" :class="inputClass(null)" />
        </div>
        <div class="space-y-1">
          <Label class="mb-1.5 px-1">Bestätigen</Label>
          <Input v-model="form.bestaetigungPasswort" type="password" :class="inputClass(null)" />
        </div>
      </div>

      <div class="pt-1 space-y-1">
        <Button variant="primary" class="w-full mt-4" @click="onSpeichern">Änderungen speichern</Button>

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
              <Input type="password" v-model="loeschPasswort" placeholder="Dein Passwort" class="border-gray-300" />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction @click="kontoLoeschen" class="bg-red-600 text-white hover:bg-red-700">
                Löschen bestätigen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  </div>
</template>