/**
 * Einstiegspunkt der Anwendung. 
 * 
 * Hier wird Vue, Pinia, Router und Firebase Authentication initialisiert.
 * Außerdem wird der Login-Status mit dem Auth-Store synchronisiert und
 * Routen über Router Guards geschützt.
 */

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

// App sofort mounten
app.mount('#app') 

const auth = getAuth()
const authStore = useAuthStore()

// Prüfen, ob ein Nutzer schon eingeloggt ist oder nicht
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      // Konto aus DB laden
      const konto = await findKontoById(user.uid);
      
      authStore.$patch({ 
        aktuellesKonto: konto ?? null,   // konto setzen, ansonsten null 
        authReady: true 
      });

    } catch (err) {
      console.error(err);

      // Bei einem Fehler, den User ausloggen und Store zurücksetzen
      authStore.$patch({ aktuellesKonto: null, authReady: true });
    }
  } else {
    // Kein Benutzer angemeldet, dann den Store zurücksetzen
    authStore.$patch({ aktuellesKonto: null, authReady: true });
  }
});

/*
 * Globaler Auth-Router-Guard
 */
router.beforeEach((to, _from, next) => {

  const publicPages = ['login', 'register'];

  // Warten, bis Firebase fertig ist und authStore geladen ist
  if (!authStore.authReady) {
    const unwatch = watch(
      () => authStore.authReady,
      (ready) => {
        if (ready) {
          unwatch()
          next(to.fullPath)
        }
      }
    );
    return;
  }

  // Soll eine geschützte Seite angezeigt werden?
  const authRequired = !publicPages.includes(to.name as string);

  /* 
   * Wenn eine geschützten Seite angezeigt werden soll und der User nicht 
   * eingeloggt ist, dann wird die Login-Seite angezeigt 
   */
  if (authRequired && !authStore.aktuellesKonto) {
    return next({ name: 'login' });
  }

  // ist der Nutzer eingeloggt, wird direkt zu Home navigiert
  if ((to.name === 'login' || to.name === 'register') && authStore.aktuellesKonto) {
    return next({ name: 'home' });
  }

  next();
})
