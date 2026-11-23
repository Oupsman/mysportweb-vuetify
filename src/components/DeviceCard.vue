<script setup lang="ts">
  import { computed } from 'vue'
  import { mdiCallMerge, mdiImageFilterHdr, mdiPencil, mdiRefresh, mdiWatch } from '@mdi/js'
  import type { AltitudeCorrection, Device } from '@/types/devices'
  import { altitudeCorrections, deviceName, unitLabel } from '@/utils/devices'
  import { formatDate } from '@/utils/format'

  // canMerge: the user has another device to merge this one into
  const props = defineProps<{ device: Device, busy?: boolean, canMerge?: boolean }>()
  const emit = defineEmits<{
    activities: [device: Device]
    correction: [device: Device, correction: AltitudeCorrection]
    merge: [device: Device]
    rename: [device: Device]
    recompute: [device: Device]
  }>()

  const corrections = altitudeCorrections
  const correction = computed(() => corrections.find(c => c.value === props.device.altitude_correction))

  const recomputing = computed(() => props.device.recompute?.running ?? false)
  const progress = computed(() => {
    const r = props.device.recompute
    return r && r.total > 0 ? ((r.done + r.failed) / r.total) * 100 : 0
  })
</script>

<template>
  <v-card border class="d-flex flex-column h-100">
    <v-card-item>
      <template #prepend>
        <v-avatar color="primary" :icon="mdiWatch" variant="tonal" />
      </template>
      <v-card-title class="d-flex align-center">
        <span class="text-truncate">{{ deviceName(device) }}</span>
        <v-btn
          aria-label="Rename"
          class="ml-1"
          density="comfortable"
          :disabled="busy"
          :icon="mdiPencil"
          size="small"
          title="Rename"
          variant="text"
          @click="emit('rename', device)"
        />
      </v-card-title>
      <v-card-subtitle v-if="device.label" :title="`How its files name it`">{{ device.name }}</v-card-subtitle>
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
        {{ correction?.subtitle }}. Applies to the activities imported after the change; recompute to apply
        it to the ones recorded before.
      </div>

      <div v-if="device.recompute" class="mt-3 text-body-2">
        <template v-if="recomputing">
          <div class="d-flex mb-1">
            <span>Recomputing the activities…</span>
            <v-spacer />
            <span class="text-medium-emphasis">{{ device.recompute.done + device.recompute.failed }} / {{ device.recompute.total }}</span>
          </div>
          <v-progress-linear color="primary" height="6" :model-value="progress" rounded />
        </template>
        <div v-else class="text-medium-emphasis">
          {{ device.recompute.done }} {{ device.recompute.done > 1 ? 'activities' : 'activity' }} recomputed
          <span v-if="device.recompute.finished_at">on {{ formatDate(device.recompute.finished_at) }}</span>
          <span v-if="device.recompute.failed > 0" class="text-error">
            · {{ device.recompute.failed }} failed: their FIT file is missing or can't be read
          </span>
        </div>
      </div>

      <div v-if="device.aliases.length > 0" class="mt-4">
        <div class="text-caption text-medium-emphasis">Also recorded as</div>
        <div v-for="alias in device.aliases" :key="`${alias.brand}/${alias.model}/${alias.serial_number}`" class="text-body-2">
          {{ alias.name }} <span class="text-medium-emphasis">· {{ unitLabel(alias) }}</span>
        </div>
      </div>
    </v-card-text>

    <v-card-actions>
      <v-btn :disabled="device.activities === 0" variant="text" @click="emit('activities', device)">
        Activities
      </v-btn>
      <v-btn
        :disabled="busy || recomputing || device.activities === 0"
        :prepend-icon="mdiRefresh"
        title="Analyse its activities again with its altitudes setting"
        variant="text"
        @click="emit('recompute', device)"
      >
        Recompute
      </v-btn>
      <v-spacer />
      <v-btn
        :disabled="busy || recomputing || !canMerge"
        :prepend-icon="mdiCallMerge"
        title="The same unit as another device, that its files named differently"
        variant="text"
        @click="emit('merge', device)"
      >
        Merge…
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
