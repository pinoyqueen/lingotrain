<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useHomeStore } from '@/stores/homeStore' 
import { ChevronRight, Plus, Trash2, LogOut } from 'lucide-vue-next'

// UI Komponenten (Beispielhaft Shadcn)
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const authStore = useAuthStore()
const homeStore = useHomeStore()
const router = useRouter()

const showImagePicker = ref(false)
const showLanguagePicker = ref(false)

const sprachenObjekt = computed(() => {
  const ids = authStore.aktuellesKonto?.sprachenIds || []
  
  return ids.map(id => authStore.verfuegbareSprachen.find(s => s.id === id))
            .filter(Boolean) 
})

onMounted(async () => {
  await authStore.loadVerfuegbareSprachen()
})

const removeLanguage = async (id: string) => {
  if (confirm("Möchten Sie diese Sprache wirklich löschen?")) {
    await authStore.removeSpracheVonKonto(id)
    
    // Optional: HomeStore neu laden, damit die Lernsets dort auch verschwinden
    await homeStore.loadHomeValues() 
  }
}

// Nur Sprachen anzeigen, die NICHT in sprachenObjekt enthalten sind
const verfuegbareSprachenZumHinzufuegen = computed(() => {
  const bereitsGewählteIds = authStore.aktuellesKonto?.sprachenIds || []
  return authStore.verfuegbareSprachen.filter(s => !bereitsGewählteIds.includes(s.id))
})

const addLanguage = async (id: string) => {
  await authStore.addSpracheZuKonto(id)
  showLanguagePicker.value = false // Dialog schließen
  await homeStore.loadHomeValues() // UI aktualisieren
}
</script>

<template>
  <div class="max-w-2xl mx-auto p-6 space-y-8 pb-20">
    
    <div class="flex flex-col items-center gap-4">
      <div class="relative group">
        <img 
          :src="authStore.aktuellesKonto?.profilbild_id || '/placeholder-user.png'" 
          class="w-32 h-32 rounded-full object-cover border-4 border-primary/10"
        />
      </div>
      <Button variant="ghost" @click="showImagePicker = true">
        Profilbild ändern
      </Button>
    </div>

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

    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold">Deine Sprachen</h2>
        <Button size="icon" variant="primary" @click="showLanguagePicker = true">
          <Plus class="w-5 h-5" />
        </Button>
      </div>

      <div class="space-y-2">
        <div 
            v-for="sprache in sprachenObjekt" 
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

    <Button variant="primary" class="w-full flex gap-2" @click="authStore.logout">
      <LogOut class="w-4 h-4" /> Abmelden
    </Button>

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