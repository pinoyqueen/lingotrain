<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import {
  CirclePlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon
} from 'lucide-vue-next'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle
} from '@/components/ui/item'

// Props definieren
interface Field {
  key: string
  label: string
  type?: 'text' | 'textarea' | 'checkbox' | 'radio'
  options?: any[] // für Radio/Select
}

interface GenericListProps<T> {
  store: any             // Store mit Methoden: load(), addItem(), editItem(), deleteItem()
  fields: Field[]        // Felder für Form
  itemKey: string        // z.B. "id"
  titleField: string     // z.B. "name" oder "vokabel"
  descriptionField?: string // optional
  loadParams?: any       // optionale Parameter für store.load()
  itemLink?: (item: T) => any // optional: erzeugt Route-Objekt
}

// Props
const props = defineProps<GenericListProps<any>>()

// UI States
const showDialog = ref(false)
const showBearbeiten = ref(false)
const neueItem = ref(true)
const selectedItem = ref<any>(null)
const form = reactive<any>({})

// Computed
const btnTitle = computed(() => showBearbeiten.value ? 'Fertig' : 'Bearbeiten')
const dialogTitle = computed(() => selectedItem.value ? 'Bearbeiten' : 'Neu')
const isLeer = computed(() => !props.store.list || props.store.list.length === 0)

// Lifecycle
onMounted(() => {
  props.store.load(props.loadParams)
})

// Methoden
function openNewDialog() {
  resetForm()
  selectedItem.value = null
  showDialog.value = true
}

function resetForm() {
  props.fields.forEach(f => {
    if (f.type === 'checkbox') form[f.key] = false
    else form[f.key] = ''
  })
}

function editItem(item: any) {
  selectedItem.value = { ...item }
  neueItem.value = false
  props.fields.forEach(f => form[f.key] = item[f.key])
  showDialog.value = true
  showBearbeiten.value = false
}

function deleteItem(item: any) {
  const ok = window.confirm(`Willst du "${item[props.titleField]}" wirklich löschen?`)
  if (ok) props.store.deleteItem(item)
  showBearbeiten.value = false
}

async function saveItem() {
  if (!selectedItem.value) {
    await props.store.addItem({ ...form })
  } else {
    await props.store.editItem({ ...selectedItem.value, ...form })
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
      <Button variant="outline" class="bg-[var(--button-primary)] w-32 h-16" @click="showBearbeiten = !showBearbeiten">
        {{ btnTitle }}
        <component :is="showBearbeiten ? CheckIcon : PencilIcon" />
      </Button>
      <Button variant="outline" class="bg-[var(--button-primary)] size-16" @click="openNewDialog">
        <CirclePlusIcon />
      </Button>
    </ButtonGroup>

    <div class="inline-block m-8 min-w-full mt-20 p-50px">
      <Item variant="outline" as-child v-for="item in props.store.list" :key="item[props.itemKey]" class="mt-4">
        <div class="flex justify-between items-center w-full">
          <router-link :to="props.itemLink!(item)" class="flex-1">
            <ItemContent>
                <ItemTitle>{{ item[props.titleField] }}</ItemTitle>
                <ItemDescription v-if="props.descriptionField">{{ item[props.descriptionField] }}</ItemDescription>
            </ItemContent>
        </router-link>

          <ItemActions class="flex gap-2 ml-2" v-show="showBearbeiten">
            <button @click="editItem(item)" class="text-black"><PencilIcon/></button>
            <button @click="deleteItem(item)" class="text-red-600"><TrashIcon/></button>
          </ItemActions>
        </div>
      </Item>
    </div>

    <!-- MODAL -->
    <div v-if="showDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl w-[400px] p-6 space-y-4">
        <h2 class="text-xl font-bold"> {{ dialogTitle }} </h2>

        <template v-for="field in props.fields">
          <input v-if="!field.type || field.type==='text'" v-model="form[field.key]" :placeholder="field.label" class="w-full border rounded p-2"/>
          <textarea v-if="field.type==='textarea'" v-model="form[field.key]" :placeholder="field.label" class="w-full border rounded p-2"/>
          <label v-if="field.type==='checkbox'" class="flex items-center gap-2">
            <input type="checkbox" v-model="form[field.key]"/>
            {{ field.label }}
          </label>
        </template>

        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="showDialog=false">Abbrechen</Button>
          <Button variant="outline" class="bg-[var(--button-primary)]" @click="saveItem">
            Speichern
          </Button>
        </div>
      </div>
    </div>
  </template>
</template>
