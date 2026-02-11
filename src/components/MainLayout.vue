<script setup lang="ts">
import AppSidebar from '@/components/AppSidebar.vue'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
</script>

<template>
  <SidebarProvider>
    <div class="flex h-screen w-full overflow-hidden">

      <AppSidebar />

      <main class="flex-1 w-full overflow-y-auto overflow-x-hidden relative bg-background">
        
        <div class="absolute top-4 left-4 z-50">
          <SidebarTrigger />
        </div>

        <slot />
      </main>
      
    </div>
  </SidebarProvider>
</template>