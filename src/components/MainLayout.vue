<script setup lang="ts">
import AppSidebar from '@/components/AppSidebar.vue'
import { SidebarProvider } from '@/components/ui/sidebar'
</script>

<template>
  <SidebarProvider>
    <AppSidebar/>
    <main class="flex-1 w-full overflow-x-hidden">
      <slot />
    </main>
  </SidebarProvider>
</template>
