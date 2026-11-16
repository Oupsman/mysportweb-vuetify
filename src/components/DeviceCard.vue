<script setup lang="ts">
  import { computed } from 'vue'
  import { mdiImageFilterHdr, mdiWatch } from '@mdi/js'
  import type { AltitudeCorrection, Device } from '@/types/devices'
  import { formatDate } from '@/utils/format'

  const props = defineProps<{ device: Device, busy?: boolean }>()
  const emit = defineEmits<{
    activities: [device: Device]
    correction: [device: Device, correction: AltitudeCorrection]
  }>()

  const corrections: { value: AltitudeCorrection, title: string, subtitle: string }[] = [
    {
      value: 'none',
      title: 'Recorded altitudes',
      subtitle: 'Kept as the device recorded them',
    },
    {
      value: 'calibrate',
      title: 'Calibrated on the terrain',
      subtitle: 'The barometer\'s profile, shifted to the ground elevation',
    },
    {
      value: 'replace',
      title: 'Terrain elevation',
      subtitle: 'The ground elevation under the GPS positions: without barometer, or a defective one',
    },
  ]

  const correction = computed(() => corrections.find(c => c.value === props.device.altitude_correction))
</script>

<template>
  <v-card border class="d-flex flex-column h-100">
    <v-card-item>
      <template #prepend>
        <v-avatar color="primary" :icon="mdiWatch" variant="tonal" />
      </template>
      <v-card-title>{{ device.name }}</v-card-title>
      <v-card-subtitle v-if="device.serial_number">Serial number {{ device.serial_number }}</v-card-subtitle>
      <v-card-subtitle v-else title="Its files don't give a serial number: every such unit of this model shares this device">
        Serial number unknown
      </v-card-subtitle>
      <template v-if="device.altitude_correction !== 'none'" #append>
        <v-chip
          color="primary"
          :prepend-icon="mdiImageFilterHdr"
          size="small"
          title="The altitudes of its activities are corrected"
        >
          Corrected
        </v-chip>
      </template>
    </v-card-item>

    <v-card-text class="flex-grow-1">
      <div class="d-flex flex-wrap ga-4">
        <div>
          <div class="text-caption text-medium-emphasis">Activities</div>
          <div>{{ device.activities }}</div>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis">Last used</div>
          <div>{{ device.last_used ? formatDate(device.last_used) : 'Never' }}</div>
        </div>
        <div v-if="device.software">
          <div class="text-caption text-medium-emphasis">Firmware</div>
          <div>{{ device.software }}</div>
        </div>
      </div>

      <v-select
        class="mt-4"
        density="compact"
        :disabled="busy"
        hide-details
        :item-props="true"
        :items="corrections"
        label="Altitudes"
        :model-value="device.altitude_correction"
        variant="outlined"
        @update:model-value="v => emit('correction', device, v)"
      />
      <div class="text-caption text-medium-emphasis mt-1">
        {{ correction?.subtitle }}. Applies to the activities imported after the change.
      </div>
    </v-card-text>

    <v-card-actions>
      <v-btn :disabled="device.activities === 0" variant="text" @click="emit('activities', device)">
        Activities
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
