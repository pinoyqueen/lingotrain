<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Toaster } from 'vue-sonner'

import MainLayout from '@/components/MainLayout.vue'
import AuthLayout from '@/components/AuthLayout.vue'

import { useKontoStore } from './stores/kontoStore'
import { useLernsetStore } from './stores/lernsetStore'

const route = useRoute()
const Layout = computed(() => route.meta.layout === 'auth' ? AuthLayout : MainLayout)

const kontoStore = useKontoStore()
const lernsetStore = useLernsetStore()

/* Globaler Watcher, der auf Änderungen am eingeloggten Konto oder der
 * aktuellen Sprache reagiert, um automatisch die Aktualisierungen 
 * am Lernset zu laden.
 */
watch(
  () => [
    kontoStore.aktuellesKonto?.id,
    kontoStore.aktuellesKonto?.aktuelleSpracheId
  ],

  async ([uid, spracheId]) => {

    // Wenn Konto und Sprache vorhanden sind, dann werden die Lernsets geladen
    if (uid && spracheId) {
      await lernsetStore.loadMySets(uid, spracheId)
    } else {
      lernsetStore.sets = []
    }
  },
  { 
    immediate: true   // Ausführen des Watchers beim App-Start
  }
)

</script>

<template>
  <component :is="Layout">
    <router-view />
  </component>

  <Toaster 
      position="top-right"
      :toastOptions="{
        classes: {
          success: '!bg-[var(--success)] !text-success-foreground border-none',
          error: '!bg-warning !text-warning-foreground',
        }
      }"
    />
</template>
