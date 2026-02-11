<script setup lang="ts">
import {Home, Settings} from 'lucide-vue-next'
import { useRoute } from 'vue-router';
import ProfileIcon from '@/assets/icons/ProfileIcon.vue'
import MeineVokabelnIcon from '@/assets/icons/MeineVokabelnIcon.vue';
import CommnityIcon from '@/assets/icons/CommnityIcon.vue';

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
    title: 'Community',
    name: 'community',
    icon: CommnityIcon,
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
</script>

<template>
  <Sidebar class="w-64 bg-gray-50 border-r" collapsible="icon">
    <SidebarHeader>
      <img src="../assets/logo.png" alt="Logo" class="w-24 h-24" />
    </SidebarHeader>

    <SidebarContent class="flex flex-col gap-1 mt-4">
      <SidebarMenu>
        <SidebarMenuItem v-for="item in items" :key="item.title">
          <SidebarMenuButton as-child>
            <router-link
              :to="{ name: item.name }"
              class="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100"
              :class="{
                  'bg-gray-200 font-semibold text-black': route.name === item.name
                }"
            >
              <component :is="item.icon" class="w-5 h-5" />
              <span>{{ item.title }}</span>
            </router-link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarContent>
  </Sidebar>
</template>

<style scoped>
</style>
