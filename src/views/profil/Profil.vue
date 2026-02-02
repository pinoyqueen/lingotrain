<script setup lang="ts">
import { getAuth, signOut } from 'firebase/auth'
import { useAuthStore } from '@/stores/authStore'
import router from '@/router'

const authStore = useAuthStore()
const auth = getAuth()

const logout = async () => {
  await signOut(auth)
  authStore.$patch({ aktuellesKonto: null })
  router.push({ name: 'login' })
}
</script>

<template>
  <h1>Profil</h1>
  <div>
    <Button @click="logout">Logout</Button>
  </div>
</template>
