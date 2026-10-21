<script setup lang="ts">
  import { mdiUpload } from '@mdi/js'
  import ActivitiesTable from '@/components/ActivitiesTable.vue'
  import { useAppStore } from '@/stores/app'

  const appStore = useAppStore()
</script>

<template>
  <v-container class="pa-4" fluid>
    <div class="d-flex align-center mb-4">
      <h1 class="text-h5">Activities</h1>
      <v-spacer />
      <v-btn color="primary" :prepend-icon="mdiUpload" @click="appStore.navigateToPage('/activity/add')">Upload activities</v-btn>
    </div>
    <ActivitiesTable />
  </v-container>
</template>
