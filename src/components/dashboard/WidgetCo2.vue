<script setup lang="ts">
  import { computed } from 'vue'
  import { mdiLeaf } from '@mdi/js'
  import { useUserStore } from '@/stores/user'
  import { formatCo2, formatDistance } from '@/utils/format'

  // CO2 saved by commuting instead of driving
  const userStore = useUserStore()
  const commutes = computed(() => userStore.dashboard.commutes)
</script>

<template>
  <v-card class="widget-card">
    <v-card-item>
      <template #prepend>
        <v-icon color="green" :icon="mdiLeaf" />
      </template>
      <v-card-title>CO₂ saved</v-card-title>
      <v-card-subtitle>Commutes instead of driving</v-card-subtitle>
    </v-card-item>
    <v-card-text v-if="commutes.all_time.activities === 0">
      Mark your activities as commutes to count the CO₂ you save.
    </v-card-text>
    <v-card-text v-else>
      <div class="text-h4 font-weight-medium">{{ formatCo2(commutes.this_year.co2) }}</div>
      <div class="text-caption text-medium-emphasis mb-2">
        this year · {{ commutes.this_year.activities }} commutes,
        {{ formatDistance(commutes.this_year.distance) }}
      </div>
      <v-divider class="mb-2" />
      <div class="d-flex justify-space-between text-body-2">
        <span>All time</span>
        <span>
          <strong>{{ formatCo2(commutes.all_time.co2) }}</strong>
          <span class="text-medium-emphasis">
            · {{ commutes.all_time.activities }} commutes,
            {{ formatDistance(commutes.all_time.distance) }}
          </span>
        </span>
      </div>
    </v-card-text>
  </v-card>
</template>
