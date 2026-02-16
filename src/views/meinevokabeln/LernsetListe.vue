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

const kontoStore = useKontoStore();
const kontoId = computed(() => kontoStore.aktuellesKonto?.id);
const aktuelleSprache = computed(() => kontoStore.aktuelleSprache?.id);
// Store/ViewModel holen
const lernsetStore = useLernsetStore();

// UI States
// gibt an, ob Dialog zum Einfügen angezeigt werden muss
const showDialog = ref(false)
// gibt an, ob die Bearbeiten Icons auf der Lernsets angezeigt werden muss
const showBearbeiten = ref(false)
// gibt an, ob die anzuzeigende Dialog zum Einfügen oder zum Bearbeiten ist
const neueItem = ref(true)

// Aktuell bearbeitetes Lernset (null = neues Set)
const selectedSet = ref<Lernset | null>(null)

// Daten der Formular
const form = reactive({
  name: '',
  beschreibung: '',
  isPublic: false,
})

// Computed für Dialog-Titel
const dialogTitle = computed(() => selectedSet.value ? 'Lernset bearbeiten' : 'Neues Lernset')
const btnTitle = computed(() => showBearbeiten.value ? 'Fertig' : 'Bearbeiten')
// gibt an, ob die Liste leer ist
const isLeer = computed(() => lernsetStore.sets.length === 0);

// Methoden
function openNewDialog() {
  resetForm()
  selectedSet.value = null
  showDialog.value = true
}

function resetForm() {
  form.name = ''
  form.beschreibung = ''
  form.isPublic = false
}

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

function deleteLernset(item: Lernset) : void {
  const ok = window.confirm(`Willst du das Lernset "${item.name}" wirklich löschen?`)
  if (ok) {
    lernsetStore.deleteLernset(item)
    toast.success(item.name + ' gelöscht')
  }
  showBearbeiten.value = false;
}

// Methode zum Speichern neues Lernsets
async function saveLernset() {
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
      zielspracheId: aktuelleSprache.value!,
    }, aktuelleSprache.value)
  } else {
    // Bestehendes Set bearbeiten
    await lernsetStore.editSet({
      ...selectedSet.value,
      name: form.name,
      beschreibung: form.beschreibung,
      isPublic: form.isPublic,
    }, aktuelleSprache.value)
  }

  toast.success('Lernset gespeichert!')
  resetForm()
  showDialog.value = false
  selectedSet.value = null
}

</script>

<template>
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
    <ButtonGroup class="fixed top-0 right-0 mt-3 mr-3">
      <Button v-show="!isLeer" variant="outline" class="bg-[var(--button-primary)] w-32 h-16" @click="showBearbeiten = !showBearbeiten">
        {{ btnTitle }}
        <component :is="showBearbeiten ? CheckIcon : PencilIcon" />
      </Button>
      <Button variant="outline" class="bg-[var(--button-primary)] size-16"  @click="openNewDialog">
        <CirclePlusIcon />
      </Button>
    </ButtonGroup>

     <template v-if="isLeer">
      <p class="text-gray-500 text-center mt-8">Keine Einträge vorhanden.</p>
    </template>

    <template v-else>
      <div class="mt-20 p-4 max-h-[calc(100vh-120px)] overflow-y-auto">
        <Item variant="outline" as-child v-for="item in lernsetStore.sets" :key="item.id" class="mt-4">
          <div class="flex justify-between items-center w-full">
            <!-- Klickbarer Bereich -->
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
              <button @click="editLernset(item)" class="text-black">
                <PencilIcon />
              </button>
              
              <button @click="deleteLernset(item)" class="text-red-600">
                <TrashIcon />
              </button>
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

          <!-- Öffentlich -->
          <label class="flex items-center gap-2">
            <input type="checkbox" v-model="form.isPublic" />
            Öffentlich
          </label>

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
