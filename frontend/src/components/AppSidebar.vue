<script setup lang="ts">
import {Bot, Home, Settings} from 'lucide-vue-next'
import { useRoute } from 'vue-router';
import ProfileIcon from '@/assets/icons/ProfileIcon.vue'
import MeineVokabelnIcon from '@/assets/icons/MeineVokabelnIcon.vue';

import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'
import SidebarHeader from './ui/sidebar/SidebarHeader.vue';

const route = useRoute()

// Menu items.
const items = [
  {
    title: 'Home',
    name: 'home',
    icon: Home,
  },
  {
    title: 'Meine Vokabeln',
    name: 'meinevokabeln',
    icon: MeineVokabelnIcon
  },
  {
    title: 'Chatbot',
    name: 'chatbot',
    icon: Bot,
  },
  {
    title: 'Profil',
    name: 'profil',
    icon: ProfileIcon,
  },
  {
    title: 'Settings',
    name: 'settings',
    icon: Settings,
  }
]

function isActive(name: string) {
  const current = route.name as string

  // Gruppe: Meine Vokabeln Bereich
  const meineVokabelnRoutes = ['meinevokabeln', 'lernset']

  const settingsRoutes = ['settings', 'kontodaten-bearbeiten']

  if (name === 'meinevokabeln') {
    return meineVokabelnRoutes.includes(current)
  } else if (name === 'settings') {
    return settingsRoutes.includes(current)
  }

  return current === name
}

</script>

<template>
  <Sidebar class="w-64 bg-gray-50 border-r" collapsible="icon">
    <SidebarHeader class="flex items-center justify-center pt-4 pb-4 group-data-[state=collapsed]:pt-8 group-data-[state=collapsed]:pb-2">
      <img 
        src="../assets/logo.png" 
        alt="Logo" 
        class="object-contain transition-all w-[75%] group-data-[state=collapsed]:w-8 h-auto"
      />
    </SidebarHeader>

    <SidebarContent class="flex flex-col gap-1 mt-4 group-data-[state=collapsed]:mt-1">
      <SidebarMenu class="px-3 group-data-[state=collapsed]:px-0">
        <SidebarMenuItem v-for="item in items" :key="item.title" class="flex justify-center">
          <SidebarMenuButton as-child>
            <router-link
              :to="{ name: item.name }"
              class="flex items-center gap-2 rounded-md transition-all hover:bg-gray-100
                     /* Offener Zustand */
                     w-full px-3 py-2
                     /* Geschlossener Zustand Fix */
                     group-data-[state=collapsed]:w-10 
                     group-data-[state=collapsed]:h-10 
                     group-data-[state=collapsed]:p-0 
                     group-data-[state=collapsed]:justify-center"
              :class="{
                  'bg-gray-200 font-semibold text-black': isActive(item.name)
                }"
            >
              <component :is="item.icon" class="w-5 h-5 shrink-0" />
              <span class="group-data-[state=collapsed]:hidden">{{ item.title }}</span>
            </router-link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarContent>
  </Sidebar>
</template>

<style scoped>
</style>
