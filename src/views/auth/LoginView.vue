<script lang="ts" setup>
import { ref } from 'vue'
import { FormField, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

const email = ref('')
const password = ref('')
const stayLoggedIn = ref(false)
const emailError = ref<string | null>(null)
const passwordError = ref<string | null>(null)
const globalError = ref<string | null>(null)
const loading = ref(false)

const onLogin = async () => {
  emailError.value = null
  passwordError.value = null
  globalError.value = null
  loading.value = true
  // login-Store-Call hier
  loading.value = false
}

const onRegister = () => {
  // navigate to register
}
</script>

<template>
  <div class="min-h-screen flex flex-col justify-center items-center px-6 w-full max-w-md">
    <!-- Logo -->
    <img src="@/assets/logo.png" alt="App Logo" class="w-35 h-35 mb-6" />

    <!-- Email -->
    <div class="w-full mt-4">
        <FormField name="email">
            <FormLabel for="email" class="block text-sm font-medium text-gray-700 mb-1.5 px-3">
                E-Mail-Adresse
            </FormLabel>
            <FormControl asChild>
                <Input 
                    type="email" 
                    v-model="email" 
                    placeholder="E-Mail-Adresse" 
                    class="focus-visible:border-[var(--primary)] focus-visible:ring-[var(--primary)]/60"
                />
            </FormControl>
            <FormMessage v-if="emailError" class="text-red-600 text-sm mt-1">{{ emailError }}</FormMessage>
        </FormField>
    </div>

    <div class="w-full mt-4">
        <FormField name="password">
            <FormLabel for="password" class="block text-sm font-medium text-gray-700 mb-1.5 px-3">
                Passwort
            </FormLabel>
            <FormControl asChild>
                <Input 
                    type="password" 
                    v-model="password" 
                    placeholder="Passwort" 
                    class="focus-visible:border-[var(--primary)] focus-visible:ring-[var(--primary)]/60"
                />
            </FormControl>
            <FormMessage v-if="passwordError" class="text-red-600 text-sm mt-1">{{ passwordError }}</FormMessage>
        </FormField>
    </div>

    <!-- Globale Fehlermeldung -->
    <p v-if="globalError" class="text-red-600 text-sm mt-2 text-center">{{ globalError }}</p>

    <!-- Angemeldet bleiben -->
    <div class="flex items-center justify-start gap-3 mt-6 w-full">
      <Checkbox id="angemeldetBleiben" v-model="stayLoggedIn" />
      <Label for="angemeldetBleiben">Angemeldet bleiben</Label>
    </div>
    
    <!-- Login-Button -->
    <Button variant="secondary" class="w-full mt-6" @click="onLogin" :loading="loading">
      Login
    </Button>

    <!-- Registrieren-Link -->
    <p class="mt-4 text-primary cursor-pointer hover:text-primary/60" @click="onRegister">
      Noch kein Konto? Registrieren
    </p>
  </div>
</template>
