<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import TestSpiel from './spielmodus/TestSpiel.vue';
import KarteiKarten from './karteikarten/KarteiKarten.vue';
import Card from '@/components/ui/card/Card.vue';
import Progress from '@/components/ui/progress/Progress.vue';

const route = useRoute()
const lernsetId = String(route.params.id)
const slug = String(route.params.slug)
const modus = String(route.params.modus)

const activeComponent = computed(() => {
  if (modus === 'spielmodus') return TestSpiel
  if (modus === 'kartenmodus') return KarteiKarten
  return null
})

const progress = ref(0) 

</script>

<template>
    <Card class="w-full m-8 shadow-xl p-6">
        <Progress :model-value="progress" class="w-full" />
        <component v-if="activeComponent" :is="activeComponent" :lernsetId="lernsetId" :slug="slug" v-model:progress="progress"/>
        <p v-else>Unbekannter Modus: {{ modus }}</p>
    </Card>
</template>
