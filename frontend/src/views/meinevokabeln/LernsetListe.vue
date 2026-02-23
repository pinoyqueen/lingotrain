<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useLernsetStore } from '@/stores/lernsetStore'
import { useKontoStore } from '@/stores/kontoStore'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Skeleton } from '@/components/ui/skeleton'
import { CirclePlusIcon, 
  PencilIcon, 
  TrashIcon,
  CheckIcon 
} from 'lucide-vue-next'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@/components/ui/item'
import type { Lernset } from '@/models/Lernset'
import { toast } from 'vue-sonner'
import { slugify } from '@/utils/slugify'
import AlertDialog from '@/components/ui/alert-dialog/AlertDialog.vue'
import AlertDialogTrigger from '@/components/ui/alert-dialog/AlertDialogTrigger.vue'
import AlertDialogContent from '@/components/ui/alert-dialog/AlertDialogContent.vue'
import AlertDialogHeader from '@/components/ui/alert-dialog/AlertDialogHeader.vue'
import AlertDialogDescription from '@/components/ui/alert-dialog/AlertDialogDescription.vue'
import AlertDialogTitle from '@/components/ui/alert-dialog/AlertDialogTitle.vue'
import AlertDialogFooter from '@/components/ui/alert-dialog/AlertDialogFooter.vue'
import AlertDialogCancel from '@/components/ui/alert-dialog/AlertDialogCancel.vue'
import AlertDialogAction from '@/components/ui/alert-dialog/AlertDialogAction.vue'

// --- Aktuelles Konto ---
const kontoStore = useKontoStore();
const kontoId = computed(() => kontoStore.aktuellesKonto?.id);

// --- Lernset Store ---
const lernsetStore = useLernsetStore();

// --- UI States --- 
/** Modal sichtbar? */
const showDialog = ref(false)
/** Bearbeiten-Icons sichtbar? */
const showBearbeiten = ref(false)
/** Dialog: neues Set oder Bearbeiten? */
const neueItem = ref(true)
/** Aktuell bearbeitetes Lernset (null = neues Set) */
const selectedSet = ref<Lernset | null>(null)

/** Daten der Formular */
const form = reactive({
  name: '',
  beschreibung: '',
  isPublic: false,
})

// --- Computed --- 
/** Titel des Dialogs */
const dialogTitle = computed(() => selectedSet.value ? 'Lernset bearbeiten' : 'Neues Lernset')
/** Beschriftug der Bearbeiten-Buttons */
const btnTitle = computed(() => showBearbeiten.value ? 'Fertig' : 'Bearbeiten')
/** true, wenn keine Lernsets vorhanden sind */
const isLeer = computed(() => lernsetStore.sets.length === 0);

/**
 * Öffnet Dialog zum Anlegen eines neuen Lernsets.
 */
function openNewDialog() {
  resetForm()
  selectedSet.value = null
  showDialog.value = true
}

/**
 * Setzt alle Formularfelder zurück.
 */
function resetForm() {
  form.name = ''
  form.beschreibung = ''
  form.isPublic = false
}

/**
 * Öffnet Dialog zum Bearbeiten eines bestehendes Lernsets.
 * 
 * @param item Lernset, das bearbeitet werden soll
 */
function editLernset(item: Lernset) : void {
  // bestehende Daten (inkl. id)
  selectedSet.value = { ...item }
  neueItem.value = false
  // Formular mit vorhandenen Daten ausfüllen
  form.name = item.name
  form.beschreibung = item.beschreibung
  form.isPublic = item.isPublic

  // Dialog öffnen
  showDialog.value = true
  showBearbeiten.value = false;
}

/**
 * Löscht ein Lernset nach Bestätigung.
 * 
 * @param item Lernset, das gelöscht werden soll
 */
function deleteLernset(item: Lernset) : void {
  lernsetStore.deleteLernset(item)
  toast.success(item.name + ' gelöscht')
  showBearbeiten.value = false;
}

/**
 * Speichert ein neues oder bearbeitetes Lernset.
 * 
 * Neues Set wird angelegt.
 * Bestehendes Set wird aktualisiert.
 */
async function saveLernset() {
  const spracheId = kontoStore.aktuellesKonto?.aktuelleSpracheId;

  if (!spracheId) {
    toast.error("Sprache wird noch geladen...");
    return;
  }

  if (!kontoId) {
    console.error("Kein Konto geladen");
    return;
  }

  if (!selectedSet.value) {
    // Neues Set anlegen
    await lernsetStore.addSet({
      name: form.name,
      beschreibung: form.beschreibung,
      isPublic: form.isPublic,
      ownerId: kontoId.value!,
      zielspracheId: spracheId,
    }, spracheId)
  } else {
    // Bestehendes Set bearbeiten
    await lernsetStore.editSet({
      ...selectedSet.value,
      name: form.name,
      beschreibung: form.beschreibung,
      isPublic: form.isPublic,
    }, spracheId)
  }

  toast.success('Lernset gespeichert!')
  resetForm()
  showDialog.value = false
  selectedSet.value = null
}

</script>

<template>

  <!-- Skeleton beim Laden -->
  <template v-if="lernsetStore.loading">
    <div class="m-8 mt-20 space-y-4">
      <!-- Simuliert 5 Lernsets -->
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

    <!-- Buttons zur Verwaltung von Lernsets -->
    <ButtonGroup class="fixed top-0 right-0 mt-3 mr-3">
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

    <!-- Anzeige von Lernsets -->
    <template v-else>

      <div class="mt-20 p-4 max-h-[calc(100vh-120px)] overflow-y-auto">
        <Item variant="outline" as-child v-for="item in lernsetStore.sets" :key="item.id" class="mt-4">
          <div class="flex justify-between items-center w-full">
            <!-- Klickbarer Bereich zur Weiterleitung an Vokabelliste-->
            <router-link
              :to="{ name: 'lernset', params: { id: item.id, slug: slugify(item.name) } }"
              class="flex-1"
            >
              <ItemContent>
                <ItemTitle>{{ item.name }}</ItemTitle>
                <ItemDescription>{{ item.beschreibung }}</ItemDescription>
              </ItemContent>
            </router-link>

            <!-- Action Buttons außerhalb vom router-link -->
            <ItemActions class="flex gap-2 ml-2" v-show="showBearbeiten">
              <!-- Button zum Bearbeiten -->
              <button @click="editLernset(item)" class="text-black"> <PencilIcon /> </button>
              <!-- Button zum Löschen -->
              <AlertDialog>
                <AlertDialogTrigger>
                  <TrashIcon  class="text-[var(--warning)]" />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Lernset wirklich löschen?</AlertDialogTitle>
                    <AlertDialogDescription>Willst du das Lernset {{ item.name }} wirklich löschen?</AlertDialogDescription> 
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction @click="deleteLernset(item)">Löschen</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </ItemActions>
          </div>
        </Item>
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

      <!-- Name -->
      <input
        v-model="form.name"
        placeholder="Name"
        class="w-full border rounded p-2"
      />

      <!-- Beschreibung -->
      <textarea
        v-model="form.beschreibung"
        placeholder="Beschreibung"
        class="w-full border rounded p-2"
      />

      <!-- Buttons -->
      <div class="flex justify-end gap-2">
        <Button variant="outline" @click="showDialog = false">
          Abbrechen
        </Button>
        <Button variant="outline" class="bg-[var(--button-primary)]" @click="saveLernset" :disabled="!form.name">
          Speichern
        </Button>
      </div>

    </div>
  </div>

</template>
