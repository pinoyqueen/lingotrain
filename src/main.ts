import { createApp, watch } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import router from './router'
import App from './App.vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { useAuthStore } from './stores/authStore'
import { findKontoById } from './repositories/KontoRepository'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.mount('#app') // sofort mounten

const auth = getAuth()
const authStore = useAuthStore()

onAuthStateChanged(auth, async (user) => {
  if (user) {
    if (!authStore.aktuellesKonto) {
      try {
        const konto = await findKontoById(user.uid)
        authStore.$patch({ aktuellesKonto: konto ?? null, authReady: true })
      } catch (err) {
        console.error(err)
        authStore.$patch({ aktuellesKonto: null, authReady: true })
      }
    } else {
      authStore.authReady = true
    }
  } else {
    authStore.$patch({ aktuellesKonto: null, authReady: true })
  }
})




// -------------------------------
// Router Guard
// -------------------------------
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  const publicPages = ['login', 'register']

  // Wenn Auth noch nicht geladen → kurz warten
  if (!authStore.authReady) {
    const unwatch = watch(
      () => authStore.authReady,
      (ready) => {
        if (ready) {
          unwatch()
          next(to.fullPath)
        }
      }
    )
    return
  }

  // Auth-Check
  const authRequired = !publicPages.includes(to.name as string)

  if (authRequired && !authStore.aktuellesKonto) {
    return next({ name: 'login' }) // nicht eingeloggt → Login
  }

  if ((to.name === 'login' || to.name === 'register') && authStore.aktuellesKonto) {
    return next({ name: 'home' }) // eingeloggt → Home
  }

  next()
})
