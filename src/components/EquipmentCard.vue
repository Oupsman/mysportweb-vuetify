<script setup lang="ts">
  import { computed } from 'vue'
  import { mdiBriefcaseOutline, mdiDeleteOutline, mdiPencilOutline, mdiStar, mdiStarOutline, mdiWrenchOutline } from '@mdi/js'
  import { mediaUrl } from '@/api'
  import type { Equipment } from '@/types/equipments'
  import { formatDate, formatDistance, formatDuration } from '@/utils/format'

  const props = defineProps<{ equipment: Equipment, busy?: boolean }>()
  const emit = defineEmits<{
    activities: [equipment: Equipment]
    edit: [equipment: Equipment]
    setDefault: [equipment: Equipment]
    delete: [equipment: Equipment]
  }>()

  const km = (value: number) => formatDistance(value * 1000)

  // the backend sends year 1 for an unknown date. A purchase date is a day saved at midnight UTC,
  // shown in UTC: in the browser's timezone it would be the day before west of Greenwich
  const purchased = computed(() => {
    const date = props.equipment.date_of_purchase
    return date && new Date(date).getUTCFullYear() > 1900
      ? new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
        .format(new Date(date))
      : ''
  })

  // there is no service log: the next one is counted from the mileage, every interval
  const maintenance = computed(() => {
    const interval = props.equipment.maintenance_interval
    if (interval <= 0) {
      return null
    }
    const since = props.equipment.mileage % interval
    const left = interval - since
    return { left, progress: (since / interval) * 100, soon: left <= interval * 0.1 }
  })
</script>

<template>
  <v-card border class="d-flex flex-column h-100" :class="{ 'border-primary border-opacity-100': equipment.is_default }">
    <!-- flex-grow-0: the free height of a card goes to its text, every picture keeps the same height -->
    <v-img
      v-if="equipment.picture"
      :alt="equipment.name"
      class="flex-grow-0"
      cover
      height="180"
      :src="mediaUrl(equipment.picture)"
    />
    <v-card-item>
      <template v-if="!equipment.picture" #prepend>
        <v-avatar color="primary" variant="tonal">{{ equipment.name.charAt(0).toUpperCase() }}</v-avatar>
      </template>
      <v-card-title>{{ equipment.name }}</v-card-title>
      <v-card-subtitle v-if="equipment.brand || equipment.model">
        {{ [equipment.brand, equipment.model].filter(Boolean).join(' ') }}
      </v-card-subtitle>
      <template #append>
        <v-chip
          v-if="equipment.is_commute"
          class="mr-1"
          :prepend-icon="mdiBriefcaseOutline"
          size="small"
          title="Given to the commute rides"
        >
          Commute
        </v-chip>
        <v-chip
          v-if="equipment.is_default"
          color="primary"
          :prepend-icon="mdiStar"
          size="small"
          title="Given to the uploaded activities"
        >
          Default
        </v-chip>
      </template>
    </v-card-item>

    <v-card-text class="flex-grow-1">
      <div class="text-h4 font-weight-medium">{{ km(equipment.mileage) }}</div>
      <div v-if="equipment.initial_mileage > 0" class="text-caption text-medium-emphasis">
        {{ km(equipment.initial_mileage) }} before its first activity here
      </div>

      <div class="d-flex flex-wrap ga-4 mt-3">
        <div>
          <div class="text-caption text-medium-emphasis">Activities</div>
          <div>{{ equipment.activities }}</div>
        </div>
        <div v-if="equipment.duration > 0">
          <div class="text-caption text-medium-emphasis">Time</div>
          <div>{{ formatDuration(equipment.duration) }}</div>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis">Last used</div>
          <div>{{ equipment.last_used ? formatDate(equipment.last_used) : 'Never' }}</div>
        </div>
        <div v-if="purchased">
          <div class="text-caption text-medium-emphasis">Purchased</div>
          <div>{{ purchased }}</div>
        </div>
        <div v-if="equipment.weight > 0">
          <div class="text-caption text-medium-emphasis">Weight</div>
          <div>{{ equipment.weight }} kg</div>
        </div>
      </div>

      <div v-if="maintenance" class="mt-4">
        <div class="d-flex align-center text-body-2 mb-1">
          <v-icon class="mr-1" :color="maintenance.soon ? 'warning' : undefined" :icon="mdiWrenchOutline" size="small" />
          <span>Service in {{ km(maintenance.left) }}</span>
          <v-spacer />
          <span class="text-caption text-medium-emphasis">every {{ km(equipment.maintenance_interval) }}</span>
        </div>
        <v-progress-linear
          :color="maintenance.soon ? 'warning' : 'primary'"
          height="6"
          :model-value="maintenance.progress"
          rounded
        />
      </div>
    </v-card-text>

    <v-card-actions>
      <v-btn :disabled="equipment.activities === 0" variant="text" @click="emit('activities', equipment)">
        Activities
      </v-btn>
      <v-spacer />
      <v-btn
        v-if="!equipment.is_default"
        :disabled="busy"
        :icon="mdiStarOutline"
        size="small"
        title="Make it the default equipment"
        variant="text"
        @click="emit('setDefault', equipment)"
      />
      <v-btn
        :disabled="busy"
        :icon="mdiPencilOutline"
        size="small"
        title="Edit"
        variant="text"
        @click="emit('edit', equipment)"
      />
      <v-btn
        color="error"
        :disabled="busy"
        :icon="mdiDeleteOutline"
        size="small"
        title="Delete"
        variant="text"
        @click="emit('delete', equipment)"
      />
    </v-card-actions>
  </v-card>
</template>
