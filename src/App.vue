<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MainLayout from '@/components/MainLayout.vue'
import AuthLayout from '@/components/AuthLayout.vue'

const route = useRoute()
const Layout = computed(() => route.meta.layout === 'auth' ? AuthLayout : MainLayout)
</script>

<template>
  <component :is="Layout">
    <router-view />
  </component>
</template>
