<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import { useLernsetStore } from '@/stores/lernsetStore'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { CirclePlusIcon, 
  PencilIcon, 
  TrashIcon, 
  BookAIcon, 
  SquarePenIcon, 
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
import { slugify } from '@/utils/slugify'

// TODO: mit aktuellesKontoID erstezen
const kontoId = 'IpPbkgnEfSMKhQq8mA6tB3dxaLe2';
// Store/ViewModel holen
const lernsetStore = useLernsetStore();

// entspricht onViewCreated() im Fragment
onMounted(() => {
  lernsetStore.loadMySets(kontoId);
});

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
  }
  showBearbeiten.value = false;
}

// Methode zum Speichern neues Lernsets
async function saveLernset() {
  if (!selectedSet.value) {
    // Neues Set anlegen
    // TODO: zielspracheid setzen
    await lernsetStore.addSet({
      name: form.name,
      beschreibung: form.beschreibung,
      isPublic: form.isPublic,
      ownerId: kontoId,
      zielspracheId: '',
    })
  } else {
    // Bestehendes Set bearbeiten
    // TODO: nur wenn set.ownerid == aktuellesKonto dann bearbeiten
    await lernsetStore.editSet({
      ...selectedSet.value,
      name: form.name,
      beschreibung: form.beschreibung,
      isPublic: form.isPublic,
    })
  }

  resetForm()
  showDialog.value = false
  selectedSet.value = null
}

</script>

<template>
  <template v-if="isLeer">
    <p class="text-gray-500 text-center mt-8">Keine Einträge vorhanden.</p>
  </template>

  <template v-else>
    <ButtonGroup class="fixed top-0 right-0 mt-3 mr-3">
      <Button variant="outline" class="bg-[var(--button-primary)] w-32 h-16" @click="showBearbeiten = !showBearbeiten">
        {{ btnTitle }}
        <component :is="showBearbeiten ? CheckIcon : PencilIcon" />
      </Button>
      <Button variant="outline" class="bg-[var(--button-primary)] size-16"  @click="openNewDialog">
        <CirclePlusIcon />
      </Button>
    </ButtonGroup>

    <div class="inline-block m-8 min-w-full mt-20 p-50px">
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
  


</template>
