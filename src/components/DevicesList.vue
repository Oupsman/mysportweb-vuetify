<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { mdiWatch } from '@mdi/js'
  import DeviceCard from '@/components/DeviceCard.vue'
  import { useDevicesStore } from '@/stores/devices'
  import { useAppStore } from '@/stores/app'
  import type { AltitudeCorrection, Device } from '@/types/devices'

  const devicesStore = useDevicesStore()
  const appStore = useAppStore()

  const isLoading = ref(true)
  const error = ref('')
  // the device being changed
  const busy = ref<string | null>(null)

  onMounted(async () => {
    try {
      await devicesStore.getAllDevices()
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      isLoading.value = false
    }
  })

  const setCorrection = async (device: Device, correction: AltitudeCorrection) => {
    error.value = ''
    busy.value = device.id
    try {
      await devicesStore.setAltitudeCorrection(device.id, correction)
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      busy.value = null
    }
  }

  // the activities page filters on the device of its query: the unit, not every unit of the model
  const showActivities = (device: Device) => appStore.navigateToPage(`/activities?device_id=${device.id}`)
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
    <v-card v-else-if="devicesStore.devices.length === 0" class="pa-8 text-center">
      <v-icon class="mb-2" :icon="mdiWatch" size="x-large" />
      <div class="text-h6">No device yet</div>
      <div class="text-medium-emphasis">
        Your watches and bike computers appear here once you upload an activity they recorded.
      </div>
    </v-card>
    <v-row v-else>
      <v-col
        v-for="device in devicesStore.devices"
        :key="device.id"
        cols="12"
        lg="4"
        sm="6"
      >
        <DeviceCard
          :busy="busy === device.id"
          :device="device"
          @activities="showActivities"
          @correction="setCorrection"
        />
      </v-col>
    </v-row>
  </div>
</template>
