<script setup lang="ts">
  import { ref } from 'vue'
  import type { Ref } from 'vue'
  import { useEquipmentsStore } from '@/stores/equipments'
  import type { Equipment } from '@/types/equipments'
  import { useAppStore } from '@/stores/app'

  const equipmentStore = useEquipmentsStore()
  // const equipment:Ref<Equipment> = ref({
  const name:Ref<string> = ref('')
  const brand:Ref<string> = ref('')
  const model:Ref<string> = ref('')
  const initialMileage:Ref<number> = ref(0)
  const weight:Ref<number> = ref(0)
  const isDefault:Ref<boolean> = ref(false)
  const dateOfPurchase:Ref<Date> = ref(new Date())
  const maintenanceInterval:Ref<number> = ref(0)
  const appStore = useAppStore()
  const error: Ref<string> = ref('')
  const create = async () => {
    const equipment: Equipment = {
      name: name.value,
      brand: brand.value,
      model: model.value,
      initial_mileage: +initialMileage.value,
      date_of_purchase: dateOfPurchase.value.toISOString(),
      weight: +weight.value,
      is_default: isDefault.value,
      maintenance_interval: +maintenanceInterval.value,
    }
    error.value = ''
    try {
      await equipmentStore.insertEquipment(equipment)
      appStore.navigateToPage('/equipments')
    } catch {
      error.value = 'The equipment could not be created'
    }
  }
</script>

<template>
  <v-container>
    <v-card>
      <v-card-title>Equipment</v-card-title>
      <v-card-text>
        <v-alert v-if="error" class="mb-4" type="error">{{ error }}</v-alert>
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
          <v-date-picker v-model="dateOfPurchase" label="Date of purchase" />
          <v-text-field v-model="initialMileage" label="Initial Mileage" type="number" />
          <v-text-field v-model="weight" label="weight" type="number" />
          <v-checkbox v-model="isDefault" label="Default equipment" />
          <v-btn color="primary" type="submit">Create</v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<style scoped lang="sass">

</style>
