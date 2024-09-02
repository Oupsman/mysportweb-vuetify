<script setup lang="ts">
  import { useAppStore } from '@/stores/app'
  import { useUserStore } from '@/stores/user'
  import { useEquipmentsStore } from '@/stores/equipments'
  const userStore = useUserStore()
  const appStore = useAppStore()
  const equipmentStore = useEquipmentsStore()

</script>

<template>
  <v-flex d-flex>
    <v-layout wrap>
      <v-flex v-for="equipment in equipmentStore.equipments" :key="equipment.id" md4>
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
      </v-flex>
    </v-layout>
  </v-flex>
</template>

<style scoped lang="sass">

</style>
