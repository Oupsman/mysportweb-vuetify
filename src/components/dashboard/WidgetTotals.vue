<script setup lang="ts">
  import { computed } from 'vue'
  import type { PropType } from 'vue'
  import { mdiCalendarCheck, mdiImageFilterHdr, mdiMapMarkerDistance, mdiTimerOutline } from '@mdi/js'
  import { useUserStore } from '@/stores/user'
  import type { PeriodTotals } from '@/types/dashboard'
  import { formatDistance, formatDuration, formatElevation } from '@/utils/format'

  // one measure this week, compared with the previous periods
  const props = defineProps({
    measure: {
      type: String as PropType<keyof PeriodTotals>,
      required: true,
    },
  })
  const userStore = useUserStore()
  const totals = computed(() => userStore.dashboard.totals)

  const tiles: Record<keyof PeriodTotals, { title: string, icon: string, format: (v: number) => string }> = {
    distance: { title: 'Distance', icon: mdiMapMarkerDistance, format: formatDistance },
    duration: { title: 'Time', icon: mdiTimerOutline, format: formatDuration },
    elevation: { title: 'Elevation', icon: mdiImageFilterHdr, format: formatElevation },
    activities: { title: 'Activities', icon: mdiCalendarCheck, format: v => String(v) },
  }
  const tile = computed(() => tiles[props.measure])
</script>

<template>
  <v-card class="widget-card">
    <v-card-item>
      <template #prepend>
        <v-icon color="primary" :icon="tile.icon" />
      </template>
      <v-card-title>{{ tile.title }}</v-card-title>
      <v-card-subtitle>This week</v-card-subtitle>
    </v-card-item>
    <v-card-text>
      <div class="text-h4 font-weight-medium">{{ tile.format(totals.this_week[measure]) }}</div>
      <div class="text-caption text-medium-emphasis mb-2">
        last week {{ tile.format(totals.last_week[measure]) }}
      </div>
      <v-divider class="mb-2" />
      <div class="d-flex justify-space-between text-body-2">
        <span>This month</span>
        <span>
          <strong>{{ tile.format(totals.this_month[measure]) }}</strong>
          <span class="text-medium-emphasis"> / last {{ tile.format(totals.last_month[measure]) }}</span>
        </span>
      </div>
      <div class="d-flex justify-space-between text-body-2">
        <span>This year</span>
        <strong>{{ tile.format(totals.this_year[measure]) }}</strong>
      </div>
      <div class="d-flex justify-space-between text-body-2">
        <span>All time</span>
        <strong>{{ tile.format(totals.all_time[measure]) }}</strong>
      </div>
    </v-card-text>
  </v-card>
</template>
