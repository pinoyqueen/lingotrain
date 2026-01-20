import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import router from './router'
import App from './App.vue'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/services/firebase'
import { signInAnonymously } from 'firebase/auth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// NUR ZUM TESTEN: automatisch anonym anmelden 
// TODO: Anonym anmelden in Firebase Authentication ausschalten
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    try {
      await signInAnonymously(auth)
      console.log('Anonym angemeldet:', auth.currentUser?.uid)
    } catch (e) {
      console.error('Anonymous Login fehlgeschlagen', e)
    }
  } else {
    console.log('Bereits angemeldet:', user.uid)
  }
})

app.mount('#app')



