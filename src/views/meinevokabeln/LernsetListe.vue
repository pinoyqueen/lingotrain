<script setup lang="ts">
import { ref, onMounted } from 'vue'
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

// TODO: mit aktuellesKontoID erstezen
const kontoId = 'IpPbkgnEfSMKhQq8mA6tB3dxaLe2';
// Store/ViewModel holen
const lernsetStore = useLernsetStore();
// entspricht onViewCreated() im Fragment
onMounted(() => {
  lernsetStore.loadMySets(kontoId);
});

// gibt an, ob Dialog zum Einfügen angezeigt werden muss
const showDialog = ref(false)
// gibt an, ob die Bearbeiten Icons auf der Lernsets angezeigt werden muss
const showBearbeiten = ref(false)
// gibt an, ob die anzuzeigende Dialog zum Einfügen oder zum Bearbeiten ist
const neueItem = ref(true)
// das bearbeitende Item, wenn null, dann Dialog ist zum Einfügen
var selectedSet: Lernset;

// Daten der Formular
const form = ref({
  name: '',
  beschreibung: '',
  isPublic: false,
})

// Methode zum Speichern neues Lernsets
const saveLernset = async (isNeu: boolean, set: Lernset) => {
  if(isNeu) {
    // Neues Lernset anlegen
    // TODO: zielspracheid setzen
    await lernsetStore.addSet({
      name: form.value.name,
      beschreibung: form.value.beschreibung,
      isPublic: form.value.isPublic,
      ownerId: kontoId,
      zielspracheId: '',
    })
  } else {
    // Bestehendes Lernset bearbeiten
    // TODO: nur wenn set.ownerid == aktuellesKonto dann bearbeiten
    if (!set) {
      throw new Error('Lernset fehlt!')
    }
    await lernsetStore.editSet({
      ...set, 
      name: form.value.name,
      beschreibung: form.value.beschreibung,
      isPublic: form.value.isPublic,
    })

  }

  // Formular zurücksetzen
  form.value = {
    name: '',
    beschreibung: '',
    isPublic: false,
  }

  // Dialog schließen
  showDialog.value = false
  // toggle zurücksetzen
  neueItem.value = true
}

function editLernset(item: Lernset) : void {
  // bestehende Daten (inkl. id)
  selectedSet = { ...item }
  neueItem.value = false
  // Formular mit vorhandenen Daten ausfüllen
  form.value = {
    name: item.name,
    beschreibung: item.beschreibung,
    isPublic: item.isPublic,
  }

  // Dialog öffnen
  showDialog.value = true
}

</script>

<template>

  <ButtonGroup class="fixed top-0 right-0 mt-3 mr-3">
      <!-- <Button variant="outline" class="bg-[var(--blue)] w-32 h-16">
        Lernen
        <BookAIcon/>
      </Button> -->
      <Button variant="outline" class="bg-[var(--button-primary)] w-32 h-16" @click="showBearbeiten = !showBearbeiten">
        {{ showBearbeiten ? 'Fertig' : 'Bearbeiten' }}
        <component :is="showBearbeiten ? CheckIcon : PencilIcon" />
      </Button>
      <Button variant="outline" class="bg-[var(--button-primary)] size-16"  @click="showDialog = true">
        <CirclePlusIcon />
      </Button>
    </ButtonGroup>

    <div class="inline-block m-8 min-w-full mt-20 p-50px">
    <Item
      variant="outline"
      as-child
      v-for="item in lernsetStore.sets"
      :key="item.name"
      class="mt-4"
    >

      <a href="#">
        <ItemContent>
          <ItemTitle>{{ item.name }}</ItemTitle>
          <ItemDescription>{{ item.beschreibung }}</ItemDescription>
        </ItemContent>
        <ItemActions>
          <button class="text-black" v-show="showBearbeiten" @click="editLernset(item)"> <PencilIcon/> </button>
          <button class="text-[var(--red)]" v-show="showBearbeiten"> <TrashIcon/> </button>
        </ItemActions>
      </a>
    </Item>
  </div>

<!-- MODAL -->
<div
  v-if="showDialog"
  class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
>
  <div class="bg-white rounded-xl w-[400px] p-6 space-y-4">

    <h2 class="text-xl font-bold">Neues Lernset</h2>

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
      <Button @click="saveLernset(neueItem, selectedSet)" :disabled="!form.name">
        Speichern
      </Button>
    </div>

  </div>
</div>


</template>
