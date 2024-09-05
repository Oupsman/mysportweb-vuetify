<script setup lang="ts">
  import { ref } from 'vue'
  import type { Ref } from 'vue'
  import { useUserStore } from '@/stores/user'
  import { useAppStore } from '@/stores/app'
  import { useEquipmentsStore } from '@/stores/equipments'

  const equipmentStore = useEquipmentsStore()
  const appStore = useAppStore()
  // const equipment:Ref<Equipment> = ref({
  const name:Ref<string> = ref('')
  const brand:Ref<string> = ref('')
  const model:Ref<string> = ref('')
  const initial_mileage:Ref<number> = ref(0)
  const weight:Ref<bigint> = ref(0)
  const is_default:Ref<boolean> = ref(false)
  const create = () => {
    const equipment: Equipment = {
      name: name.value,
      brand: brand.value,
      model: model.value,
      initial_mileage: +initial_mileage.value,
      weight: +weight.value,
      is_default: is_default.value,
    }
    equipmentStore.insertEquipment(equipment)
  }
</script>

<template>
  <v-container>
    <v-card>
      <v-card-title>Equipment</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="create">
          <v-text-field
            v-model="name"
            autofocus
            label="Name"
            type="text"
          />
          <v-text-field
            v-model="brand"
            label="Brand"
            type="text"
          />
          <v-text-field
            v-model="model"
            label="Model"
            type="text"
          />
          <!-- <v-date-picker v-model="date_of_purchase" label="Date of purchase" /> -->
          <v-text-field v-model="initial_mileage" label="Initial Mileage" type="number" />
          <v-text-field v-model="weight" label="weight" type="number" />
          <v-checkbox v-model="is_default" label="Default equipment" />
          <v-btn color="primary" type="submit">Create</v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<style scoped lang="sass">

</style>
