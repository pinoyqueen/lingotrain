<script setup lang="ts">
import AppSidebar from '@/components/AppSidebar.vue'
import { SidebarProvider } from '@/components/ui/sidebar'
</script>

<template>
  <SidebarProvider>
    <div class="flex h-screen w-full overflow-hidden">

      <!-- Sidebar -->
      <AppSidebar />

      <!-- Main Content -->
      <main class="flex-1 w-full overflow-x-hidden">
        <slot />
      </main>

    </div>
  </SidebarProvider>
</template>
