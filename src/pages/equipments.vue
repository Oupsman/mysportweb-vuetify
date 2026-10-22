<script setup lang="ts">
  import { mdiPlus } from '@mdi/js'
  import EquipmentsList from '@/components/EquipmentsList.vue'
  import { useAppStore } from '@/stores/app'

  const appStore = useAppStore()
</script>

<template>
  <v-container>
    <div class="d-flex align-center mb-4">
      <h2 class="text-h4">Equipments</h2>
      <v-spacer />
      <v-btn color="primary" :prepend-icon="mdiPlus" @click="appStore.navigateToPage('/equipment/add')">
        Add
      </v-btn>
    </div>
    <EquipmentsList />
  </v-container>
</template>
