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
    kontoStore.aktuellesKonto?.aktuelleSpracheId,
    kontoStore.aktuellesKonto?.sprachenIds
  ],

  async ([uid, spracheId, sIds]) => {

    // Wenn Konto und Sprache vorhanden sind, dann werden die Lernsets geladen
    if (uid && spracheId) {
      await kontoStore.loadSprachenZuKonto(uid as string, sIds as string[], spracheId as string);
      await lernsetStore.loadMySets(uid as string, spracheId as string);
    } else {
      lernsetStore.sets = [];
    }
  },
  { 
    immediate: true,   // Ausführen des Watchers beim App-Start
    deep: true
  }
)

</script>

<template>
  <component :is="Layout">
    <router-view />
  </component>

  <Toaster 
      position="top-center"
      :toastOptions="{
        classes: {
          success: '!bg-[var(--success)] !text-success-foreground border-none',
          error: '!bg-warning !text-warning-foreground',
        }
      }"
    />
</template>
