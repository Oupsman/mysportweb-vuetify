<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import EquipmentForm from '@/components/EquipmentForm.vue'
  import { useAppStore } from '@/stores/app'
  import { useEquipmentsStore } from '@/stores/equipments'
  import type { Equipment } from '@/types/equipments'

  const route = useRoute('/equipment/[id]/edit')
  const appStore = useAppStore()
  const equipmentsStore = useEquipmentsStore()

  const equipment = ref<Equipment | null>(null)
  const error = ref('')

  const load = async () => {
    equipment.value = null
    error.value = ''
    try {
      equipment.value = await equipmentsStore.getEquipment(route.params.id)
      appStore.pageTitle = equipment.value.name
    } catch (e) {
      error.value = (e as Error).message
    }
  }
  watch(() => route.params.id, load, { immediate: true })
</script>

<template>
  <v-container>
    <h2 class="text-h4 mb-4">Edit equipment</h2>
    <v-alert v-if="error" type="error">{{ error }}</v-alert>
    <!-- keyed: the form copies the equipment once -->
    <EquipmentForm v-else-if="equipment" :key="equipment.id" :equipment="equipment" />
    <div v-else>Loading...</div>
  </v-container>
</template>
