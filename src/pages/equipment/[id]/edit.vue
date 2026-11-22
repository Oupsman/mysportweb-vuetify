<script setup lang="ts">
  import { nextTick, ref, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import EquipmentForm from '@/components/EquipmentForm.vue'
  import EquipmentReminders from '@/components/EquipmentReminders.vue'
  import EquipmentServices from '@/components/EquipmentServices.vue'
  import { useAppStore } from '@/stores/app'
  import { useEquipmentsStore } from '@/stores/equipments'
  import type { Equipment } from '@/types/equipments'

  const route = useRoute('/equipment/[id]/edit')
  const appStore = useAppStore()
  const equipmentsStore = useEquipmentsStore()

  const equipment = ref<Equipment | null>(null)
  const error = ref('')
  const servicesList = ref<InstanceType<typeof EquipmentServices> | null>(null)

  const load = async () => {
    equipment.value = null
    error.value = ''
    try {
      equipment.value = await equipmentsStore.getEquipment(route.params.id)
      appStore.pageTitle = equipment.value.name
      // the services button of the equipment cards, and the notifications, open the page on a section
      if (route.hash === '#services' || route.hash === '#reminders') {
        await nextTick()
        document.getElementById(route.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
      }
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
    <template v-else-if="equipment">
      <EquipmentForm :key="equipment.id" :equipment="equipment" />
      <EquipmentReminders
        id="reminders"
        :key="`reminders-${equipment.id}`"
        class="mt-6"
        :equipment="equipment"
        @done="servicesList?.load()"
      />
      <EquipmentServices
        id="services"
        :key="`services-${equipment.id}`"
        ref="servicesList"
        class="mt-6"
        :equipment="equipment"
      />
    </template>
    <div v-else>Loading...</div>
  </v-container>
</template>
