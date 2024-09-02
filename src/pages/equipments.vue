<script setup lang="ts">
  // import EquipmentsList from '@/components/EquipmentsList.vue'
  import { useAppStore } from '@/stores/app'
  // const userStore = useUserStore();
  const appStore = useAppStore()

</script>

<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h2 class="text-h2">Equipments</h2>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-btn color="primary" @click="appStore.navigateToPage('/equipment/add')">Add Equipment</v-btn>
      </v-col>
    </v-row>
    <EquipmentsList />
  </v-container>
</template>

<style scoped lang="sass">

</style>
