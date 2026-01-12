import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '@/views/home/Home.vue'
import ProfileView from '@/views/profil/Profil.vue'
import MeineVokabelnView from '@/views/meinevokabeln/MeineVokabeln.vue'
import CommunityView from '@/views/community/Community.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/profil',
    name: 'profil',
    component: ProfileView,
  },
  {
    path: '/meinevokabeln',
    name: 'meinevokabeln',
    component: MeineVokabelnView,
  },
  {
    path: '/community',
    name: 'community',
    component: CommunityView,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
