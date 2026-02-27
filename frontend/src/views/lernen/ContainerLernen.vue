<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import ContainerSpiel from './spielmodus/ContainerSpiel.vue';
import KarteiKarten from './karteikarten/KarteiKarten.vue';
import Card from '@/components/ui/card/Card.vue';
import Progress from '@/components/ui/progress/Progress.vue';

/** Route auslesen, um Paramtere zu bekommen */
const route = useRoute()
/** ID des Lernsets */
const lernsetId = String(route.params.id)
/** Slug für die URL */
const slug = String(route.params.slug)
/** spielmodus oder kartenmodus */
const modus = String(route.params.modus)
/** Fortschritt für Progressbar, wird vom Kind-Modus über v-model aktualisiert */
const progress = ref(0) 

/** Wählt dynamisch die Kind-Komponente basierend auf dem Modus */
const activeComponent = computed(() => {
  if (modus === 'spielmodus') 
    return ContainerSpiel
  if (modus === 'kartenmodus') return KarteiKarten
  return null
})

</script>

<template>
  <div class="h-[calc(100vh-60px)] p-4 box-border">
    <!-- Container -->
    <Card class="w-full h-full flex flex-col rounded-xl shadow-xl overflow-hidden">
        <!-- Fortschrittsanzeige oben -->
        <Progress :model-value="progress" class="w-full h-2 shrink-0" />
        <!-- dynamische Kind-Komponente -->
        <component v-if="activeComponent" :is="activeComponent" :lernsetId="lernsetId" :slug="slug" v-model:progress="progress" class="flex-1"/>
        <!-- Fallback für unbekannten Modus -->
        <p v-else>Unbekannter Modus: {{ modus }}</p>
    </Card>
  </div>
</template>