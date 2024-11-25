<script setup lang="ts">
  import { useEquipmentsStore } from '@/stores/equipments'
  const equipmentStore = useEquipmentsStore()

</script>

<template>

  <v-sheet v-for="equipment in equipmentStore.equipments" :key="equipment.id" class="d-flex flex-wrap">
    <v-card class="h-auto w-25">
      <v-card-title> {{ equipment.name }}</v-card-title>
      <v-card-text> {{ equipment.brand }} - {{ equipment.model }} ></v-card-text>
    </v-card>
  </v-sheet>

</template>

<style scoped lang="sass">

</style>
