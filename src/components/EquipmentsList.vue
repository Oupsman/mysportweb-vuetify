<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { mdiPlus, mdiToolboxOutline } from '@mdi/js'
  import EquipmentCard from '@/components/EquipmentCard.vue'
  import { useEquipmentsStore } from '@/stores/equipments'
  import { useAppStore } from '@/stores/app'
  import type { Equipment } from '@/types/equipments'

  const equipmentsStore = useEquipmentsStore()
  const appStore = useAppStore()

  const isLoading = ref(true)
  const error = ref('')
  // the equipment being changed
  const busy = ref<string | null>(null)

  onMounted(async () => {
    try {
      await equipmentsStore.getAllEquipments()
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      isLoading.value = false
    }
  })

  const change = async (equipment: Equipment, action: () => Promise<void>) => {
    error.value = ''
    busy.value = equipment.id
    try {
      await action()
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      busy.value = null
    }
  }

  const setDefault = (equipment: Equipment) => change(equipment, () => equipmentsStore.setDefault(equipment))

  const remove = (equipment: Equipment) => {
    const activities = equipment.activities > 0
      ? ` Its ${equipment.activities} activities are kept, without equipment.`
      : ''
    if (confirm(`Delete "${equipment.name}"?${activities}`)) {
      change(equipment, () => equipmentsStore.deleteEquipment(equipment.id))
    }
  }

  // the activities page filters on the equipment of its query
  const showActivities = (equipment: Equipment) => appStore.navigateToPage(`/activities?equipment=${equipment.id}`)
  const edit = (equipment: Equipment) => appStore.navigateToPage(`/equipment/${equipment.id}/edit`)
</script>

<template>
  <div>
    <v-alert
      v-if="error"
      class="mb-4"
      closable
      type="error"
      @click:close="error = ''"
    >{{ error }}</v-alert>

    <div v-if="isLoading">Loading...</div>
    <v-card v-else-if="equipmentsStore.equipments.length === 0" class="pa-8 text-center">
      <v-icon class="mb-2" :icon="mdiToolboxOutline" size="x-large" />
      <div class="text-h6">No equipment yet</div>
      <div class="text-medium-emphasis mb-4">
        Add your bikes and shoes to follow their mileage and know when they need a service.
      </div>
      <v-btn color="primary" :prepend-icon="mdiPlus" @click="appStore.navigateToPage('/equipment/add')">
        Add an equipment
      </v-btn>
    </v-card>
    <v-row v-else>
      <v-col
        v-for="equipment in equipmentsStore.equipments"
        :key="equipment.id"
        cols="12"
        lg="4"
        sm="6"
      >
        <EquipmentCard
          :busy="busy !== null"
          :equipment="equipment"
          @activities="showActivities"
          @delete="remove"
          @edit="edit"
          @set-default="setDefault"
        />
      </v-col>
    </v-row>
  </div>
</template>
