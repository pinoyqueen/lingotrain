import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '@/views/home/Home.vue'
import ProfileView from '@/views/profil/Profil.vue'
import LernsetListeView from '@/views/meinevokabeln/LernsetListe.vue'
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
    component: LernsetListeView,
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
