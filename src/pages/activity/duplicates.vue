<script setup lang="ts">
  import { mdiArrowLeft } from '@mdi/js'
  import DuplicateActivities from '@/components/DuplicateActivities.vue'
  import { useAppStore } from '@/stores/app'

  const appStore = useAppStore()
  appStore.pageTitle = 'Duplicate activities'
</script>

<template>
  <v-container class="pa-4" fluid>
    <div class="d-flex align-center mb-4">
      <v-btn :icon="mdiArrowLeft" variant="text" @click="appStore.navigateToPage('/activities')" />
      <h1 class="text-h5">Duplicate activities</h1>
    </div>
    <DuplicateActivities />
  </v-container>
</template>
