<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { ChevronRight, Plus, Trash2, LogOut } from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useSprachenStore } from '@/stores/sprachenStore'
import { useKontoStore } from '@/stores/kontoStore'

const authStore = useAuthStore()
const sprachenStore = useSprachenStore()
const kontoStore = useKontoStore()
const router = useRouter()

/** Ist der Dialog zum Auswählen eines Profilbilds geöffnet? */
const showImagePicker = ref(false)

/** Ist der Dialog zum Auswählen einer Sprache geöffnet? */
const showLanguagePicker = ref(false)

// Beim Laden der Seite alle verfügbaren Sprachen laden
onMounted(async () => {
  await sprachenStore.loadVerfuegbareSprachen();
})

/**
 * Zu den IDs der ausgewählten Sprachen eines Kontos, wird
 * das gesamte Objekt mit Name und Flagge geladen.
 */
const sprachenObjekte = computed(() => {
  const ids = kontoStore.aktuellesKonto?.sprachenIds || [];
  
  return ids.map(id => sprachenStore.verfuegbareSprachen.find(s => s.id === id))
            .filter(Boolean);
})

/**
 * Entfernen einer Sprache eines Kontos.
 * 
 * Hier wird zunächst eine Abfrage durchgeführt, ob die Sprache wirklich gelöscht werden soll.
 * Anschließend wird die Sprache über den {@link authStore} gelöscht.
 * 
 * @param id die ID der zu löschenden Sprache
 */
const removeLanguage = async (id: string) => {
  if (confirm("Möchten Sie diese Sprache wirklich löschen?")) {
    await kontoStore.removeSpracheVonKonto(id);
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
  showLanguagePicker.value = false;
}

/**
 * Ermitteln der Sprachen, die der Nutzer noch nicht ausgewählt hat und somit 
 * noch zum Konto hinzufügen kann.
 * 
 * @returns Array von Sprachobjekten, die verfügbar sind, um sie dem Konto hinzuzufügen
 */
const verfuegbareSprachenZumHinzufuegen = computed(() => {
  const bereitsGewählteIds = kontoStore.aktuellesKonto?.sprachenIds || [];
  return sprachenStore.verfuegbareSprachen.filter(s => !bereitsGewählteIds.includes(s.id));
})
</script>

<template>
  <div class="max-w-2xl mx-auto p-6 space-y-8 pb-20">
    
    <!-- Profilbild anzeigen (+ Button zum Ändern) -->
    <div class="flex flex-col items-center gap-4">
      <div class="relative group">
        <img 
          :src="kontoStore.aktuellesKonto?.profilbild_id" 
          class="w-32 h-32 rounded-full object-cover border-4 border-primary/10"
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
        @click="router.push({ name: 'profil-bearbeiten' })"
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
          <Button variant="ghost" size="icon" @click="removeLanguage(sprache.id)">
            <Trash2 class="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>
    </section>

    <!-- Logout-Button -->
    <Button variant="primary" class="w-full flex gap-2" @click="authStore.logout">
      <LogOut class="w-4 h-4" /> Abmelden
    </Button>

    <!-- Dialog zum Auswählen einer neuen Sprache, der sich beim Hinzufügen einer neuen Sprache öffnet -->
    <Dialog v-model:open="showLanguagePicker">
      <DialogContent class="sm:max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
          <DialogTitle>Neue Sprache lernen</DialogTitle>
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
  </div>
</template>