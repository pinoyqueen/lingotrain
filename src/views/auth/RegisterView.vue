<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useKontoStore } from '@/stores/kontoStore'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'

const router = useRouter()
const kontoStore = useKontoStore()

const sprachen = [
  { id: 1, name: 'Französisch', flag: 'https://firebasestorage.googleapis.com/v0/b/lingotrain-6ce70.firebasestorage.app/o/flaggen%2FFlag_of_France.png?alt=media&token=b6845f8d-8723-41d7-b7fd-6c4be8488d1a' },
  { id: 2, name: 'Englisch', flag: 'https://firebasestorage.googleapis.com/v0/b/lingotrain-6ce70.firebasestorage.app/o/flaggen%2FFlag_of_the_United_Kingdom.png?alt=media&token=e63be653-1e4a-4e17-82fb-c63754ec8793' },
  { id: 3, name: 'Spanisch', flag: 'https://firebasestorage.googleapis.com/v0/b/lingotrain-6ce70.firebasestorage.app/o/flaggen%2FFlag_of_Spain.png?alt=media&token=c39b4a69-976a-41e1-bd43-b67b78e3ad95' }
]

function inputClass(error: string | null) {
  return [
    'border rounded-md px-3 py-2 w-full',

    error 
      ? 'border-2 border-[var(--warning)] focus-visible:border-[var(--primary)] focus-visible:ring-[var(--primary)]/60'
      : 'border-gray-300 focus-visible:border-[var(--primary)] focus-visible:ring-[var(--primary)]/60'
  ]
}


async function onRegister() {
  const success = await kontoStore.register()
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
        <Select v-model="kontoStore.sprache">
          <SelectTrigger class="w-full" :class="inputClass(kontoStore.errorSprache)">
            <!-- Zeige aktuelle Auswahl mit zugehöriger Flagge -->
            <div class="flex items-center gap-5">
                <img
                    v-if="kontoStore.sprache && sprachen.find(s => s.name === kontoStore.sprache)"
                    :src="sprachen.find(s => s.name === kontoStore.sprache)?.flag"
                    class="h-5 w-auto"
                />
                <span>{{ kontoStore.sprache || 'Sprache auswählen' }}</span>
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
        <p v-if="kontoStore.errorSprache" class="text-[var(--warning)] text-sm px-1">{{ kontoStore.errorSprache }}</p>
      </div>

      <!-- Vorname -->
      <div class="space-y-1">
        <Label class="mb-1.5 px-1">Vorname</Label>
        <Input v-model="kontoStore.vorname" placeholder="Vorname" :class="inputClass(kontoStore.errorVorname)" />
        <p v-if="kontoStore.errorVorname" class="text-[var(--warning)] text-sm px-1">{{ kontoStore.errorVorname }}</p>
      </div>

      <!-- Nachname -->
      <div class="space-y-1">
        <Label class="mb-1.5 px-1">Nachname</Label>
        <Input v-model="kontoStore.nachname" placeholder="Nachname" :class="inputClass(kontoStore.errorNachname)" />
        <p v-if="kontoStore.errorNachname" class="text-[var(--warning)] text-sm px-1">{{ kontoStore.errorNachname }}</p>
      </div>

      <!-- Email -->
      <div class="space-y-1">
        <Label class="mb-1.5 px-1">E-Mail</Label>
        <Input v-model="kontoStore.email" type="email" placeholder="E-Mail" :class="inputClass(kontoStore.errorEmail)" />
        <p v-if="kontoStore.errorEmail" class="text-[var(--warning)] text-sm px-1">{{ kontoStore.errorEmail }}</p>
      </div>

      <!-- Username -->
      <div class="space-y-1">
        <Label class="mb-1.5 px-1">Benutzername</Label>
        <Input v-model="kontoStore.username" placeholder="Benutzername" :class="inputClass(kontoStore.errorUsername)" />
        <p v-if="kontoStore.errorUsername" class="text-[var(--warning)] text-sm px-1">{{ kontoStore.errorUsername }}</p>
      </div>

      <!-- Passwort -->
      <div class="space-y-1">
        <Label class="mb-1.5 px-1">Passwort</Label>
        <Input v-model="kontoStore.passwort" type="password" placeholder="Passwort" :class="inputClass(kontoStore.errorPasswort)" />
        <p v-if="kontoStore.errorPasswort" class="text-[var(--warning)] text-sm px-1">{{ kontoStore.errorPasswort }}</p>
      </div>

      <!-- Passwort bestätigen -->
      <div class="space-y-1">
        <Label class="mb-1.5 px-1">Passwort bestätigen</Label>
        <Input v-model="kontoStore.passwortConfirm" type="password" placeholder="Passwort bestätigen" :class="inputClass(kontoStore.errorPasswortConfirm)" />
        <p v-if="kontoStore.errorPasswortConfirm" class="text-[var(--warning)] text-sm px-1">{{ kontoStore.errorPasswortConfirm }}</p>
      </div>

      <!-- Global Error -->
      <p v-if="kontoStore.errorGlobal" class="text-[var(--warning)] text-sm text-center">{{ kontoStore.errorGlobal }}</p>

      <!-- Submit -->
      <Button variant="secondary" type="submit" class="w-full mt-4">Registrieren</Button>
    </form>

    <!-- Login Link -->
    <p class="mt-4 text-primary cursor-pointer hover:opacity-70 text-center" @click="router.push({ name: 'login' })">
      Schon registriert? Zum Login
    </p>
  </div>
</template>
