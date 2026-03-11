<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Skeleton } from '@/components/ui/skeleton'
import { CirclePlusIcon, 
  PencilIcon, 
  TrashIcon, 
  BookAIcon, 
  CheckIcon 
} from 'lucide-vue-next'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@/components/ui/item'
import { useRoute, useRouter } from 'vue-router'
import { useVokabelnStore } from '@/stores/vokabelnStore'
import type { Vokabeln } from '@/models/Vokabeln'
import { toast } from 'vue-sonner'
import 'vue-sonner/style.css'
import AlertDialog from '@/components/ui/alert-dialog/AlertDialog.vue'
import AlertDialogTrigger from '@/components/ui/alert-dialog/AlertDialogTrigger.vue'
import AlertDialogContent from '@/components/ui/alert-dialog/AlertDialogContent.vue'
import AlertDialogHeader from '@/components/ui/alert-dialog/AlertDialogHeader.vue'
import AlertDialogTitle from '@/components/ui/alert-dialog/AlertDialogTitle.vue'
import AlertDialogDescription from '@/components/ui/alert-dialog/AlertDialogDescription.vue'
import AlertDialogFooter from '@/components/ui/alert-dialog/AlertDialogFooter.vue'
import AlertDialogCancel from '@/components/ui/alert-dialog/AlertDialogCancel.vue'
import AlertDialogAction from '@/components/ui/alert-dialog/AlertDialogAction.vue'

// --- Vokabeln Store ---
const vokabelnStore = useVokabelnStore()

// --- Route ---
const route = useRoute()
const router = useRouter()

// Lernset-Id aus der URL
const lernsetId = String(route.params.id)
const slug = String(route.params.slug)

/** 
 * Wird ausgeführt sobald die Komponente geladen wurde.
 * Lädt alle Vokabeln des aktuellen Lernsets
 */
onMounted(() => {
    vokabelnStore.loadByLernsetId(lernsetId)
});

// --- UI States ---
/** Modal sichtbar? */
const showDialog = ref(false)
/** Bearbeiten-Icons sichtbar? */
const showBearbeiten = ref(false)
/** Dialog: neues Set oder Bearbeiten? */
const neueItem = ref(true)
/** Zeigt das Lernmodus-Menu */
const showMenu = ref(false)
/** Aktuell bearbeitete Vokabeln (null = neue Vokabel) */
const selectedItem = ref<Vokabeln | null>(null)

/** Daten der Formular */
const form = reactive({
  vokabel: '',
  uebersetzung: '',
  isWort: false,
})

// --- Computed --- 
/** Titel des Dialogs */
const dialogTitle = computed(() => selectedItem.value ? 'Vokabel bearbeiten' : 'Neue Vokabel')
/** Beschriftug der Bearbeiten-Buttons */
const btnTitle = computed(() => showBearbeiten.value ? 'Fertig' : 'Bearbeiten')
/** true, wenn keine Vokabeln vorhanden sind */
const isLeer = computed(() => vokabelnStore.liste.length === 0);

/**
 * Öffnet Dialog zum Anlegen eines neuen Lernsets.
 */
function openNewDialog() {
  resetForm()
  selectedItem.value = null
  showDialog.value = true
}

/**
 * Navigiert zum Lernmodus.
 * @param modus Spielmodus oder Kartenmodus
 */
function goTo(modus: string) {
  showMenu.value = false
  console.log('Ausgewählt:', modus)
  
  // Navigation abhängig vom Modus
  router.push({
    name: 'lernen',
    params: {
      id: lernsetId,
      slug: slug,
      modus: modus
    }
  })
}

/**
 * Setzt alle Formularfelder zurück.
 */
function resetForm() {
  form.vokabel = ''
  form.uebersetzung = ''
  form.isWort = false
}

/**
 * Öffnet Dialog zum Bearbeiten eines bestehende Vokabel.
 * 
 * @param item Vokabel, die bearbeitet werden soll
 */
function editVokabel(item: Vokabeln) : void {
  // bestehende Daten (inkl. id)
  selectedItem.value = { ...item }
  neueItem.value = false
  // Formular mit vorhandenen Daten ausfüllen
  form.vokabel = item.vokabel
  form.uebersetzung = item.uebersetzung
  form.isWort = item.isWort

  // Dialog öffnen
  showDialog.value = true
  showBearbeiten.value = false;
}

/**
 * Löscht eine Vokabel nach Bestätigung.
 * 
 * @param item Vokabel, die gelöscht werden soll
 */
function deleteVokabel(item: Vokabeln) : void {
  vokabelnStore.deleteVokabel(item)
  toast.success(item.vokabel + ' gelöscht')
  showBearbeiten.value = false;
}

/**
 * Speichert eine neue oder bearbeitete Vokabel.
 * 
 * Neue Vokabel wird angelegt.
 * Bestehende Vokabel wird aktualisiert.
 */
async function saveVokabel() {
  if (!selectedItem.value) {
    // Neue Vokabel anlegen
    await vokabelnStore.addVokabel({
      vokabel: form.vokabel,
      uebersetzung: form.uebersetzung,
      beschreibung: '',
      isWort: form.isWort,
      setId: lernsetId
    })
  } else {
    // Bestehende Vokabel bearbeiten
    await vokabelnStore.editVokabel({
      ...selectedItem.value,
      vokabel: form.vokabel,
      uebersetzung: form.uebersetzung,
      isWort: form.isWort,
    })
  }

  toast.success('Vokabel gespeichert!')
  resetForm()
  showDialog.value = false
  selectedItem.value = null
}

</script>

<template>

  <!-- Skeleton beim Laden -->
  <template v-if="vokabelnStore.loading">
    <div class="m-8 mt-20 space-y-4">
      <!-- Simuliert 5 Vokabeln -->
      <div v-for="n in 5" :key="n" class="flex justify-between items-center animate-pulse">
        <!-- Card Content Skeleton -->
        <div class="flex-1 space-y-2">
          <Skeleton class="h-6 w-1/2 rounded-md" />
          <Skeleton class="h-4 w-3/4 rounded-md" />
        </div>
      </div>
    </div>
  </template>

  <template v-else>

    <!-- Buttons zur Verwaltung von Vokabeln -->
    <ButtonGroup class="fixed top-0 right-0 mt-3 mr-3">
      <Button
        v-show="!isLeer"
        variant="outline"
        class="bg-[var(--button-primary)] w-32 h-16 flex items-center justify-center"
        @click="showMenu = !showMenu"
      >
        Lernen
        <BookAIcon class="ml-2"/>
      </Button>
      <Button v-show="!isLeer" variant="outline" class="bg-[var(--button-primary)] w-32 h-16" @click="showBearbeiten = !showBearbeiten">
        {{ btnTitle }}
        <component :is="showBearbeiten ? CheckIcon : PencilIcon" />
      </Button>
      <Button variant="outline" class="bg-[var(--button-primary)] size-16"  @click="openNewDialog">
        <CirclePlusIcon />
      </Button>
    </ButtonGroup>

    <!-- nichts anzeigen wenn keine Lernsets vorhanden ist -->
    <template v-if="isLeer">
      <p class="text-gray-500 text-center mt-8">Keine Einträge vorhanden.</p>
    </template>

    <!-- Anzeige von Vokabeln -->
    <template v-else>
      <div class="mt-20 p-4 max-h-[calc(100vh-120px)] overflow-y-auto">
        <Item
          variant="outline"
          as-child
          v-for="item in vokabelnStore.liste"
          :key="item.id"
          class="mt-4"
        >
          <ItemContent>
            <ItemTitle>{{ item.vokabel }}</ItemTitle>
            <ItemDescription>{{ item.uebersetzung }}</ItemDescription>
            <!-- Action Buttons außerhalb vom router-link -->
            <ItemActions class="flex gap-2 ml-2" v-show="showBearbeiten">
              <!-- Button zum Bearbeiten -->
              <button class="text-black" @click="editVokabel(item)"> <PencilIcon/> </button>
              <!-- Button zum Löschen -->
              <AlertDialog>
                <AlertDialogTrigger>
                  <TrashIcon  class="text-[var(--warning)]" />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Vokabel wirklich löschen?</AlertDialogTitle>
                    <AlertDialogDescription>Willst du die Vokabeln {{ item.vokabel }} wirklich löschen?</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction @click="deleteVokabel(item)">Löschen</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

            </ItemActions>
          </ItemContent>
        </Item>
      </div>

      <!-- LERNEN-MENÜ -->
        <div
          v-if="showMenu"
          class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <div class="bg-white rounded-xl w-[400px] p-6 space-y-4">
            <h2 class="text-xl font-bold"> Wie möchtest du üben? </h2>

            <Button
              variant="outline" class="w-full bg-[var(--button-primary)]"
              @click="goTo('spielmodus')"
            >
              Lernen mit Spiele
            </Button>
            <Button
              variant="outline" class="w-full bg-[var(--button-primary)]"
              @click="goTo('kartenmodus')"
            >
              Üben mit Karteikarten
            </Button>

            <div class="flex justify-end gap-2">
              <Button variant="outline" @click="showMenu = false">
                Abbrechen
              </Button>
          </div>
          </div>
        </div>
    </template>
  </template>
  <!-- MODAL -->
      <div
        v-if="showDialog"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      >
        <div class="bg-white rounded-xl w-[400px] p-6 space-y-4">

          <h2 class="text-xl font-bold"> {{ dialogTitle }} </h2>

          <!-- Vokabel -->
          <input
            v-model="form.vokabel"
            placeholder="Name"
            class="w-full border rounded p-2"
          />

          <!-- Übersetzung -->
          <input
            v-model="form.uebersetzung"
            placeholder="Uebersetzung"
            class="w-full border rounded p-2"
          />

          <!-- Wort oder Satz-->
          <div class="flex items-center gap-4">
            <label class="flex items-center gap-2">
              <input type="radio" v-model="form.isWort" :value="true" />
              Wort
            </label>

            <label class="flex items-center gap-2">
              <input type="radio" v-model="form.isWort" :value="false" />
              Satz
            </label>
          </div>


          <!-- Buttons -->
          <div class="flex justify-end gap-2">
            <Button variant="outline" @click="showDialog = false">
              Abbrechen
            </Button>
            <Button variant="outline" class="bg-[var(--button-primary)]" @click="saveVokabel" :disabled="!form.vokabel || !form.uebersetzung">
              Speichern
            </Button>
          </div>

        </div>
      </div>
  

</template>
