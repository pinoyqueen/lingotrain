<script setup lang="ts">
import { Calendar, Home, Inbox, Search, Settings } from 'lucide-vue-next'
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
    url: '#',
    icon: Home,
  },
  {
    title: 'Meine Vokabeln',
    url: '#',
    icon: Inbox,
  },
  {
    title: 'Community',
    url: '#',
    icon: Calendar,
  },
  {
    title: 'Profil',
    url: '#',
    icon: Search,
  },
  {
    title: 'Settings',
    url: '#',
    icon: Settings,
  },
]
</script>

<template>
  <Sidebar class="my-sidebar">
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
.my-sidebar {
  background-color: #ab8abc;
  color: white;
}
</style>
