<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { ChevronRightIcon, ExternalLinkIcon } from 'lucide-vue-next'

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@/components/ui/item'
</script>

<template>
  <h1>Meine Vokabeln</h1>
  <div class="flex w-full max-w-md flex-col gap-4">
    <Item as-child>
      <a href="#">
        <ItemContent>
          <ItemTitle>Visit our documentation</ItemTitle>
          <ItemDescription>
            Learn how to get started with our components.
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <ChevronRightIcon class="size-4" />
        </ItemActions>
      </a>
    </Item>
    <Item variant="outline" as-child>
      <a href="#" target="_blank" rel="noopener noreferrer">
        <ItemContent>
          <ItemTitle>External resource</ItemTitle>
          <ItemDescription>
            Opens in a new tab with security attributes.
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <ExternalLinkIcon class="size-4" />
        </ItemActions>
      </a>
    </Item>
  </div>
  <div>
    <Button>Click me</Button>
  </div>
</template>
