import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '@/views/auth/LoginView.vue'
import HomeView from '@/views/home/Home.vue'
import ProfileView from '@/views/profil/Profil.vue'
import LernsetListeView from '@/views/meinevokabeln/LernsetListe.vue'
import CommunityView from '@/views/community/Community.vue'
import VokabelnListeView from '@/views/meinevokabeln/VokabelnListe.vue'

const routes = [
  {
    path: '/',
    name: 'login',
    component: LoginView,
    meta: { layout: 'auth' }
  },
  {
    path: '/home',
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
    path: '/meinevokabeln/:id/:slug',
    name: 'lernset',
    component: VokabelnListeView,
    props: true,
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
