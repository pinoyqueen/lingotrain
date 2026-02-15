<script setup lang="ts">
import { useVkStore } from '@/stores/vokabelKontoStore';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import Button from '@/components/ui/button/Button.vue';

const route = useRoute()
const vkStore = useVkStore()
const lernsetId = String(route.params.id)

onMounted(async () => {
    await vkStore.ladeVokabeln(lernsetId)
    console.log("aktuelle Frage: " + vkStore.aktuelleFrage?.vokabel)

})

function next() {
  vkStore.nextFrage()
  console.log("aktuelle Frage: " + vkStore.aktuelleFrage?.vokabel)
}
</script>

<template>
  <h2>Spiel Container</h2>
  <Button @click="next">Next</Button>
  <Button >Lösung prüfen</Button>
</template>
