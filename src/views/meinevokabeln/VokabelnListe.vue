<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
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
import { useRoute } from 'vue-router'
import { useVokabelnStore } from '@/stores/vokabelnStore'
import type { Vokabeln } from '@/models/Vokabeln'

// TODO: mit aktuellesKontoID erstezen
// const kontoId = 'IpPbkgnEfSMKhQq8mA6tB3dxaLe2';
// Store/ViewModel holen
const vokabelnStore = useVokabelnStore();
const route = useRoute();
// Lernset-Id
const lernsetId = String(route.params.id)

// entspricht onViewCreated() im Fragment
onMounted(() => {
    vokabelnStore.loadByLernsetId(lernsetId)
});

// UI States
// gibt an, ob Dialog zum Einfügen angezeigt werden muss
const showDialog = ref(false)
// gibt an, ob die Bearbeiten Icons auf der Lernsets angezeigt werden muss
const showBearbeiten = ref(false)
// gibt an, ob die anzuzeigende Dialog zum Einfügen oder zum Bearbeiten ist
const neueItem = ref(true)

// Aktuell bearbeitete Vokabel (null = neue Vokabel)
const selectedItem = ref<Vokabeln | null>(null)

// Daten der Formular
const form = reactive({
  vokabel: '',
  uebersetzung: '',
  isWort: false,
})

// Computed für Dialog-Titel
const dialogTitle = computed(() => selectedItem.value ? 'Vokabel bearbeiten' : 'Neue Vokabel')
const btnTitle = computed(() => showBearbeiten.value ? 'Fertig' : 'Bearbeiten')
// gibt an, ob die Liste leer ist
const isLeer = computed(() => vokabelnStore.liste.length === 0);

// Methoden
function openNewDialog() {
  resetForm()
  selectedItem.value = null
  showDialog.value = true
}

function resetForm() {
  form.vokabel = ''
  form.uebersetzung = ''
  form.isWort = false
}

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

function deleteVokabel(item: Vokabeln) : void {
  const ok = window.confirm(`Willst du die Vokabel "${item.vokabel}" wirklich löschen?`)
  if (ok) {
    vokabelnStore.deleteVokabel(item)
  }
  showBearbeiten.value = false;
}

// Methode zum Speichern neues Lernsets
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

  resetForm()
  showDialog.value = false
  selectedItem.value = null
}

</script>

<template>
  <template v-if="isLeer">
    <p class="text-gray-500 text-center mt-8">Keine Einträge vorhanden.</p>
  </template>

  <template v-else>
    <ButtonGroup class="fixed top-0 right-0 mt-3 mr-3">
      <Button variant="outline" class="bg-[var(--button-primary)] w-32 h-16">
        Lernen
        <BookAIcon/>
      </Button>
      <Button variant="outline" class="bg-[var(--button-primary)] w-32 h-16" @click="showBearbeiten = !showBearbeiten">
        {{ btnTitle }}
        <component :is="showBearbeiten ? CheckIcon : PencilIcon" />
      </Button>
      <Button variant="outline" class="bg-[var(--button-primary)] size-16"  @click="openNewDialog">
        <CirclePlusIcon />
      </Button>
    </ButtonGroup>

    <div class="inline-block m-8 min-w-full mt-20 p-50px">
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
          <ItemActions class="flex gap-2 ml-2" v-show="showBearbeiten">
            <button class="text-black" @click="editVokabel(item)"> <PencilIcon/> </button>
            <button class="text-[var(--red)]" @click="deleteVokabel(item)"> <TrashIcon/> </button>
          </ItemActions>
        </ItemContent>
      </Item>
    </div>

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

</template>
