import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '@/views/auth/LoginView.vue'
import RegisterView from '@/views/auth/RegisterView.vue'
import HomeView from '@/views/home/Home.vue'
import ProfileView from '@/views/profil/Profil.vue'
import EinstellungenView from '@/views/einstellungen/EinstellungenView.vue'
import LernsetListeView from '@/views/meinevokabeln/LernsetListe.vue'
import CommunityView from '@/views/community/Community.vue'
import VokabelnListeView from '@/views/meinevokabeln/VokabelnListe.vue'
import BaseLernenView from '@/views/lernen/BaseLernen.vue'

const routes = [
  {
    path: '/',
    name: 'login',
    component: LoginView,
    meta: { layout: 'auth' }
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
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
    path: '/lernen/:modus/:id/:slug',
    name: 'lernen',
    component: BaseLernenView,
    props: true,
  },
  {
    path: '/community',
    name: 'community',
    component: CommunityView,
  },
  {
    path: '/settings',
    name: 'settings',
    component: EinstellungenView
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
