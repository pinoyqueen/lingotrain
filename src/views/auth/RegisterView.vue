<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { FormField, FormLabel, FormControl } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

const router = useRouter()

/* Form States */
const sprache = ref('')
const vorname = ref('')
const nachname = ref('')
const email = ref('')
const username = ref('')
const passwort = ref('')
const passwortConfirm = ref('')

/* Error */
const globalError = ref('')

/* Dummy-Sprachen */
const sprachen = [
  { id: 1, name: 'Französisch', flag: 'https://firebasestorage.googleapis.com/v0/b/lingotrain-6ce70.firebasestorage.app/o/flaggen%2FFlag_of_France.png?alt=media&token=b6845f8d-8723-41d7-b7fd-6c4be8488d1a' },
  { id: 2, name: 'Englisch', flag: 'https://firebasestorage.googleapis.com/v0/b/lingotrain-6ce70.firebasestorage.app/o/flaggen%2FFlag_of_the_United_Kingdom.png?alt=media&token=e63be653-1e4a-4e17-82fb-c63754ec8793' },
  { id: 3, name: 'Spanisch', flag: 'https://firebasestorage.googleapis.com/v0/b/lingotrain-6ce70.firebasestorage.app/o/flaggen%2FFlag_of_Spain.png?alt=media&token=c39b4a69-976a-41e1-bd43-b67b78e3ad95' }
]

/* Register */
function onRegister() {
  globalError.value = ''

  if (!email.value || !passwort.value || !vorname.value || !nachname.value) {
    globalError.value = 'Bitte alle Pflichtfelder ausfüllen'
    return
  }

  if (passwort.value !== passwortConfirm.value) {
    globalError.value = 'Passwörter stimmen nicht überein'
    return
  }

  console.log('Register:', {
    sprache: sprache.value,
    vorname: vorname.value,
    nachname: nachname.value,
    email: email.value,
    username: username.value,
    passwort: passwort.value,
  })

  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen flex flex-col justify-center items-center px-6 py-12 w-full max-w-xl">
    
    <!-- Logo -->
    <img src="@/assets/logo.png" alt="App Logo" class="w-35 h-35 mb-6" />

    <!-- Sprache -->
    <div class="w-full mt-4">
      <FormField name="sprache">
        <FormLabel class="block text-sm font-medium text-gray-700 mb-1.5 px-3">
          Lernsprache
        </FormLabel>
        <FormControl asChild>
          <Select v-model="sprache">
            <SelectTrigger class="w-full focus-visible:border-[var(--primary)] focus-visible:ring-[var(--primary)]/50">
              <SelectValue placeholder="Sprache auswählen" />
            </SelectTrigger>
            <SelectContent class="w-full">
              <SelectItem
                v-for="s in sprachen"
                :key="s.id"
                :value="s.name"
              >
                <div class="flex items-center gap-4">
                  <img :src="s.flag" class="h-5 w-auto" />
                  <span>{{ s.name }}</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </FormControl>
      </FormField>
    </div>

    <!-- Vorname -->
    <div class="w-full mt-4">
      <FormField name="vorname">
        <FormLabel class="block text-sm font-medium text-gray-700 mb-1.5 px-3">Vorname</FormLabel>
        <FormControl asChild>
          <Input v-model="vorname" placeholder="Vorname" class="focus-visible:border-[var(--primary)] focus-visible:ring-[var(--primary)]/60" />
        </FormControl>
      </FormField>
    </div>

    <!-- Nachname -->
    <div class="w-full mt-4">
      <FormField name="nachname">
        <FormLabel class="block text-sm font-medium text-gray-700 mb-1.5 px-3">Nachname</FormLabel>
        <FormControl asChild>
          <Input v-model="nachname" placeholder="Nachname" class="focus-visible:border-[var(--primary)] focus-visible:ring-[var(--primary)]/60" />
        </FormControl>
      </FormField>
    </div>

    <!-- Email -->
    <div class="w-full mt-4">
      <FormField name="email">
        <FormLabel class="block text-sm font-medium text-gray-700 mb-1.5 px-3">E-Mail-Adresse</FormLabel>
        <FormControl asChild>
          <Input v-model="email" type="email" placeholder="E-Mail-Adresse" class="focus-visible:border-[var(--primary)] focus-visible:ring-[var(--primary)]/60" />
        </FormControl>
      </FormField>
    </div>

    <!-- Username -->
    <div class="w-full mt-4">
      <FormField name="username">
        <FormLabel class="block text-sm font-medium text-gray-700 mb-1.5 px-3">Benutzername</FormLabel>
        <FormControl asChild>
          <Input v-model="username" placeholder="Benutzername" class="focus-visible:border-[var(--primary)] focus-visible:ring-[var(--primary)]/60" />
        </FormControl>
      </FormField>
    </div>

    <!-- Passwort -->
    <div class="w-full mt-4">
      <FormField name="passwort">
        <FormLabel class="block text-sm font-medium text-gray-700 mb-1.5 px-3">Passwort</FormLabel>
        <FormControl asChild>
          <Input v-model="passwort" type="password" placeholder="Passwort" class="focus-visible:border-[var(--primary)] focus-visible:ring-[var(--primary)]/60" />
        </FormControl>
      </FormField>
    </div>

    <!-- Passwort bestätigen -->
    <div class="w-full mt-4">
      <FormField name="passwortConfirm">
        <FormLabel class="block text-sm font-medium text-gray-700 mb-1.5 px-3">Passwort bestätigen</FormLabel>
        <FormControl asChild>
          <Input v-model="passwortConfirm" type="password" placeholder="Passwort bestätigen" class="focus-visible:border-[var(--primary)] focus-visible:ring-[var(--primary)]/60" />
        </FormControl>
      </FormField>
    </div>

    <!-- Globale Fehlermeldung -->
    <p v-if="globalError" class="text-red-600 text-sm mt-2 text-center">{{ globalError }}</p>

    <!-- Button -->
    <Button variant="secondary" class="w-full mt-6" @click="onRegister">
      Registrieren
    </Button>

    <!-- Login Link -->
    <p class="mt-4 text-primary cursor-pointer hover:text-primary/60 text-center" @click="router.push({ name: 'login' })">
      Schon registriert? Zum Login
    </p>

  </div>
</template>