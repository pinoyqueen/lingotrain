<script setup lang="ts">
import AppSidebar from '@/components/AppSidebar.vue'
import { SidebarProvider } from '@/components/ui/sidebar'
</script>

<template>
  <SidebarProvider>
    <AppSidebar/>
    <main class="min-w-3/4">
      <slot />
    </main>
  </SidebarProvider>
</template>
