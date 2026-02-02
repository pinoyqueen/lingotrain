<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'


const router = useRouter()
const auth = useAuthStore()

const stayLoggedIn = ref(false)

function inputClass(error: string | null) {
  return [
    'border rounded-md px-3 py-2 w-full',

    error 
      ? 'border-2 border-[var(--warning)] focus-visible:border-[var(--primary)] focus-visible:ring-[var(--primary)]/60'
      : 'border-gray-300 focus-visible:border-[var(--primary)] focus-visible:ring-[var(--primary)]/60'
  ]
}

const onLogin = async () => {
  const success = await auth.login(stayLoggedIn.value)
  if (success) router.push({ name: 'home' })
}
</script>

<template>
  <div class="min-h-screen flex flex-col justify-center items-center px-6 py-12 w-full max-w-md">
    
    <!-- Logo -->
    <img src="@/assets/logo.png" alt="App Logo" class="w-35 h-35 mb-6" />

    <form class="w-full space-y-4" @submit.prevent="onLogin">

        <!-- Email -->
        <div class="space-y-1">
            <Label for="email" class="mb-1.5 px-1">E-Mail-Adresse</Label>
            <Input 
                type="text" 
                v-model="auth.loginForm.email" 
                placeholder="E-Mail-Adresse" 
                :class="inputClass(auth.loginErrors.email)"
            />
            <p v-if="auth.loginErrors.email" class="text-[var(--warning)] text-sm px-1">{{ auth.loginErrors.email }}</p>
      </div>

        <!-- Passwort -->
        <div class="space-y-1">
            <Label class="mb-1.5 px-1">Passwort</Label>
            <Input v-model="auth.loginForm.passwort" type="password" placeholder="Passwort" :class="inputClass(auth.loginErrors.passwort)" />
            <p v-if="auth.loginErrors.passwort" class="text-[var(--warning)] text-sm px-1">{{ auth.loginErrors.passwort }}</p>
        </div>

        <!-- Global Error -->
        <p v-if="auth.loginErrors.global" class="text-[var(--warning)] text-sm text-center">{{ auth.loginErrors.global }}</p>

        <!-- Angemeldet bleiben -->
        <div class="flex items-center justify-start gap-3 mt-6 w-full">
            <Checkbox id="angemeldetBleiben" v-model="stayLoggedIn" />
            <Label for="angemeldetBleiben">Angemeldet bleiben</Label>
        </div>

        <!-- Login-Button -->
        <Button variant="secondary" class="w-full mt-6" @click="onLogin">
            Login
        </Button>

        <!-- Registrieren-Link -->
        <p class="mt-4 text-primary cursor-pointer hover:text-primary/60"  @click="router.push({ name: 'register' })">
        Noch kein Konto? Registrieren
        </p>

    </form>
  </div>
</template>
