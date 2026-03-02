<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { ChevronRight, Plus, Trash2, LogOut } from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useSprachenStore } from '@/stores/sprachenStore'
import { useKontoStore } from '@/stores/kontoStore'
import { useProfilbilderStore } from '@/stores/profilbilderStore'

const authStore = useAuthStore()
const sprachenStore = useSprachenStore()
const kontoStore = useKontoStore()
const profilbilderStore = useProfilbilderStore()
const router = useRouter()

/** Ist der Dialog zum Auswählen eines Profilbilds geöffnet? */
const showImagePicker = ref(false)

/** Ist der Dialog zum Auswählen einer Sprache geöffnet? */
const showLanguagePicker = ref(false)

// Steuerung für den Lösch-Dialog
const showDeleteAlert = ref(false)
const languageToDelete = ref<string | null>(null)

// Beim Laden der Seite alle verfügbaren Sprachen und Profilbilder laden
onMounted(async () => {
  await sprachenStore.loadVerfuegbareSprachen();
  await profilbilderStore.loadVerfuegbareProfilbilder();
})

/**
 * Zu den IDs der ausgewählten Sprachen eines Kontos, wird
 * das gesamte Objekt mit Name und Flagge geladen.
 * 
 * @returns die Sprachen-Objekte
 */
const sprachenObjekte = computed(() => {
  const ids = kontoStore.aktuellesKonto?.sprachenIds || [];
  
  return ids.map(id => sprachenStore.verfuegbareSprachen.find(s => s.id === id))
            .filter(Boolean);
})

/**
 * Zu der ID des Profilbildes eines Kontos, wird
 * das gesamte Objekt mit dem Link zum Bild geladen.
 * 
 * @returns das Objekt des Profilbildes oder null
 */
const aktuellesProfilbild = computed(() => {
  const id = kontoStore.aktuellesKonto?.profilbild_id;
  if(!id) return null;

  const bilder = profilbilderStore.verfuegbareProfilbilder;
  const gefunden = bilder.find(p => p.id === id)
  return gefunden?.bildlink || null;
})

/**
 * Öffnet den Alert-Dialog und speichert die ID der Sprache zwischen
 */
const confirmRemoveLanguage = (id: string) => {
  languageToDelete.value = id
  showDeleteAlert.value = true
}

/**
 * Entfernen einer Sprache eines Kontos.
 * 
 * Hier wird zunächst eine Abfrage durchgeführt, ob die Sprache wirklich gelöscht werden soll.
 * Anschließend wird die Sprache über den {@link authStore} gelöscht.
 * 
 * @param id die ID der zu löschenden Sprache
 */
const removeLanguage = async () => {
  if(languageToDelete.value) {
    await kontoStore.removeSpracheVonKonto(languageToDelete.value);
    await kontoStore.checkAbzeichen()
    languageToDelete.value = null;
    showDeleteAlert.value = false;
  }
}

/**
 * Hinzufügen einer Sprache zu einem Konto.
 * 
 * Um eine Sprache auswählen zu können, die hinzugefügt werden soll, wurde ein Dialog geöffnet.
 * Dieser wird nach dem Hinzufügen wieder geschlossen.
 * 
 * @param id die ID der Sprache, die hinzugefügt werden soll
 */
const addLanguage = async (id: string) => {
  await kontoStore.addSpracheZuKonto(id);
  await kontoStore.checkAbzeichen()
  showLanguagePicker.value = false;
}

/**
 * Ermitteln der Sprachen, die der Nutzer noch nicht ausgewählt hat und somit 
 * noch zum Konto hinzufügen kann.
 * 
 * @returns Array von Sprachobjekten, die verfügbar sind, um sie dem Konto hinzuzufügen
 */
const verfuegbareSprachenZumHinzufuegen = computed(() => {
  const bereitsGewaehlteIds = kontoStore.aktuellesKonto?.sprachenIds || [];
  return sprachenStore.verfuegbareSprachen.filter(s => !bereitsGewaehlteIds.includes(s.id));
})

/**
 * Wechseln des Profilbildes eines Kontos.
 * 
 * Hier wird die Methode des {@link kontoStore} aufgerufen, um ein Profilbild zu ändern und
 * auf das neu ausgewählte zu setzen. Außerdem wird der Dialog wieder geschlossen, indem die
 * verfügbaren Profilbilder angezeigt wurden.
 * 
 * @param id die ID des neu ausgewählten Profilbildes
 */
const changeProfilbild = async (id: string) => {
  await kontoStore.updateKontoData({ profilbild_id: id });

  showImagePicker.value = false;
}
</script>

<template>
  <div class="max-w-2xl mx-auto p-6 space-y-8 pb-20">
    
    <!-- Profilbild anzeigen (+ Button zum Ändern) -->
    <div class="flex flex-col items-center gap-4">
      <div class="relative group">
        <img 
          v-if="aktuellesProfilbild"
          :src="aktuellesProfilbild" 
          class="w-32 h-32 p-0.5 rounded-full object-cover border-4 border-primary/10"
        />
      </div>
      <Button variant="ghost" @click="showImagePicker = true">
        Profilbild ändern
      </Button>
    </div>

    <!-- Section, mit einer Weiterleitung beim Klick, um die Kontodaten bearbeiten zu können -->
    <section class="space-y-4">
      <h2 class="text-xl font-bold">Konto</h2>
      <div 
        @click="router.push({ name: 'kontodaten-bearbeiten' })"
        class="flex items-center justify-between p-4 bg-secondary/70 rounded-lg cursor-pointer hover:bg-secondary/50 transition"
      >
        <span>Kontodaten bearbeiten</span>
        <ChevronRight class="w-5 h-5 opacity-50" />
      </div>
    </section>

    <!-- Sprach-Section (Anzeigen aller ausgewählten + Hinzufügen von neuen und Entfernen von vorhandenen) -->
    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold">Deine Sprachen</h2>
        <Button size="icon" variant="primary" @click="showLanguagePicker = true">
          <Plus class="w-5 h-5" />
        </Button>
      </div>

      <div class="space-y-2">
        <div 
            v-for="sprache in sprachenObjekte" 
            :key="sprache.id"
            class="flex items-center justify-between p-3 bg-card border rounded-md shadow-sm"
        >
            <div class="flex items-center gap-4">
                <img :src="sprache.flagge" class="w-auto h-5" />
                <span class="font-medium">{{ sprache.sprache }}</span>
            </div>
          <Button variant="ghost" size="icon" @click="confirmRemoveLanguage(sprache.id)">
            <Trash2 class="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>
    </section>

    <!-- Logout-Button -->
    <Button variant="primary" class="w-full flex gap-2" @click="authStore.logout">
      <LogOut class="w-4 h-4" /> Abmelden
    </Button>

    <AlertDialog v-model:open="showDeleteAlert">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sprache wirklich entfernen?</AlertDialogTitle>
          <AlertDialogDescription>
            Möchtest du die Sprache 
            "{{ sprachenObjekte.find(s => s.id === languageToDelete)?.sprache }}"
            wirklich aus deinem Profil löschen? 
            Dein Lernfortschritt in dieser Sprache könnte verloren gehen.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="languageToDelete = null">Abbrechen</AlertDialogCancel>
          <AlertDialogAction 
            @click="removeLanguage"
            class="bg-warning text-warning-foreground hover:bg-warning/80"
          >
            Löschen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Dialog zum Auswählen einer neuen Sprache, der sich beim Hinzufügen einer neuen Sprache öffnet -->
    <Dialog v-model:open="showLanguagePicker">
      <DialogContent class="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Neue Sprache lernen</DialogTitle>
          <DialogDescription>Wähle eine neue Sprache aus der Liste.</DialogDescription>
        </DialogHeader>
          
        <div class="overflow-y-auto py-4 space-y-2">
          <div 
              v-for="sprache in verfuegbareSprachenZumHinzufuegen" 
              :key="sprache.id"
              @click="addLanguage(sprache.id)"
              class="flex items-center justify-between p-4 bg-secondary/30 rounded-lg cursor-pointer hover:bg-primary/20 transition group"
          >
              <div class="flex items-center gap-4">
              <img :src="sprache.flagge" class="w-auto h-6 shadow-sm" />
              <span class="font-medium">{{ sprache.sprache }}</span>
              </div>
              <Plus class="w-5 h-5 opacity-0 group-hover:opacity-100 transition text-primary" />
          </div>

          <p v-if="verfuegbareSprachenZumHinzufuegen.length === 0" class="text-center text-muted-foreground py-8">
              Du lernst bereits alle verfügbaren Sprachen!
          </p>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Dialog zum Auswählen eines neuen Profilbildes -->
    <Dialog v-model:open="showImagePicker">
      <DialogContent class="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Profilbild auswählen</DialogTitle>
          <DialogDescription>Wähle ein neues Profilbild aus der Liste.</DialogDescription>
        </DialogHeader>
          
        <div class="overflow-y-auto py-4">
          <div class="grid grid-cols-3 sm:grid-cols-4 gap-4">
            <div 
              v-for="profilbild in profilbilderStore.verfuegbareProfilbilder" 
              :key="profilbild.id"
              @click="changeProfilbild(profilbild.id)"
              class="cursor-pointer group"
            >
              <img 
                :src="profilbild.bildlink"
                class="w-full aspect-square object-cover rounded-xl border-2 border-transparent group-hover:border-primary transition"
              />
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>