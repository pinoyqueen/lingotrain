<script setup lang="ts">
import {Home, Settings} from 'lucide-vue-next'
import ProfileIcon from '@/assets/icons/ProfileIcon.vue'
import MeineVokabelnIcon from '@/assets/icons/MeineVokabelnIcon.vue';
import CommnityIcon from '@/assets/icons/CommnityIcon.vue';

import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import SidebarHeader from './ui/sidebar/SidebarHeader.vue';

// Menu items.
const items = [
  {
    title: 'Home',
    url: '/',
    icon: Home,
  },
  {
    title: 'Meine Vokabeln',
    url: '/meinevokabeln',
    icon: MeineVokabelnIcon
  },
  {
    title: 'Community',
    url: '/community',
    icon: CommnityIcon,
  },
  {
    title: 'Profil',
    url: '/profil',
    icon: ProfileIcon,
  },
  {
    title: 'Settings',
    url: '#',
    icon: Settings,
  }
]
</script>

<template>
  <Sidebar>
    <SidebarHeader>
      <img src="../assets/logo.png" alt="Logo" />
    </SidebarHeader>
    <SidebarMenu>
      <SidebarMenuItem v-for="item in items" :key="item.title">
        <SidebarMenuButton as-child>
          <a :href="item.url">
            <component :is="item.icon" />
            <span>{{ item.title }}</span>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </Sidebar>
</template>

<style scoped>
</style>
