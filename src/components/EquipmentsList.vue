<script setup lang="ts">
  import { useEquipmentsStore } from '@/stores/equipments'
  const equipmentStore = useEquipmentsStore()

</script>

<template>

  <v-layout wrap>
    <li v-for="equipment in equipmentStore.equipments" :key="equipment.id">
      <v-card class="mb-4">
        <v-row>
          <v-col cols="12">
            <v-row>
              <v-col cols="12">
                <h5 class="text-h5">{{ equipment.name }}</h5>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <p> {{ equipment.brand }} - {{ equipment.equipmentmodel }} ></p>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-card>
    </li>
  </v-layout>

</template>

<style scoped lang="sass">

</style>
