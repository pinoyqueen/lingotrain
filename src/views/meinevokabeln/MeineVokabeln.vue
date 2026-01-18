<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { CirclePlusIcon, PencilIcon, TrashIcon, BookAIcon, SquarePenIcon } from 'lucide-vue-next'


import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@/components/ui/item'

const testliste = [
  { title: 'Beispiel1', beschreibung: 'Hier ist Beispiel 1' },
  { title: 'Beispiel2', beschreibung: 'Hier ist Beispiel 2' },
  { title: 'Beispiel3', beschreibung: 'Hier ist Beispiel 3' },
  { title: 'Beispiel4', beschreibung: 'Hier ist Beispiel 4' },
  { title: 'Beispiel5', beschreibung: 'Hier ist Beispiel 5' },
  { title: 'Beispiel6', beschreibung: 'Hier ist Beispiel 6' },
  { title: 'Beispiel7', beschreibung: 'Hier ist Beispiel 7' },
]
</script>

<template>
  <ButtonGroup class="fixed top-0 right-0 mt-3 mr-3">
      <Button variant="outline" class="bg-[var(--blue)] w-32 h-16">
        Lernen
        <BookAIcon/>
      </Button>
      <Button variant="outline" class="bg-[var(--blue)] w-32 h-16">
        Bearbeiten
        <SquarePenIcon/>
      </Button>
      <Button variant="outline" class="bg-[var(--blue)] size-16">
        <CirclePlusIcon />
      </Button>
    </ButtonGroup>
  <!-- <div class="flex flex-col gap-4 liste min-w-full mt-3"> -->
    <div class="inline-block m-8 min-w-full mt-20 p-50px">
    <Item
      variant="outline"
      as-child
      v-for="item in testliste"
      :key="item.title"
      class="mt-4"
    >

      <a href="#">
        <ItemContent>
          <ItemTitle>{{ item.title }}</ItemTitle>
          <ItemDescription>{{ item.beschreibung }}</ItemDescription>
        </ItemContent>
        <ItemActions>
          <button class="text-black"> <PencilIcon/> </button>
          <button class="text-[var(--red)] "> <TrashIcon/> </button>
          <!-- <ChevronRightIcon class="w-4 h-4" /> -->
        </ItemActions>
      </a>
    </Item>
  </div>

  <!-- <div class="mt-6 btn">
    <Button>
      <CirclePlusIcon class="size-6 text-black"/>
    </Button>
  </div> -->
</template>

<style>
.liste {
  padding: 50px;
}

.btn {
  position: fixed;
  bottom: 20px; 
  right: 20px; 
  z-index: 50;  
}

</style>
