<script setup lang="ts">
  import { mdiTrophyOutline } from '@mdi/js'
  import { useAppStore } from '@/stores/app'
  import { useUserStore } from '@/stores/user'
  import type { SportRecord, SportSummary } from '@/types/dashboard'
  import { formatDate, formatDistance, formatDuration, formatElevation, sportColor, sportIcon, sportLabel } from '@/utils/format'

  const userStore = useUserStore()
  const appStore = useAppStore()
  const open = (id: string) => appStore.navigateToPage(`/activity/${id}`)

  // records of a sport, with their unit
  const records = (sport: SportSummary) => [
    { label: 'Longest distance', record: sport.longest_distance, format: formatDistance },
    { label: 'Longest duration', record: sport.longest_duration, format: formatDuration },
    { label: 'Biggest climb', record: sport.biggest_climb, format: formatElevation },
  ].filter((r): r is { label: string, record: SportRecord, format: (v: number) => string } => r.record !== null)
</script>

<template>
  <v-card class="widget-card">
    <v-card-title>By sport</v-card-title>
    <v-card-text>
      <div v-for="(sport, index) in userStore.dashboard.sports" :key="sport.sport" :class="{ 'mt-4': index > 0 }">
        <div class="d-flex align-center">
          <v-icon class="mr-2" :color="sportColor(sport.sport, index)" :icon="sportIcon(sport.sport)" />
          <span class="text-subtitle-1 font-weight-medium">{{ sportLabel(sport.sport) }}</span>
          <v-spacer />
          <span class="text-caption text-medium-emphasis">{{ sport.totals.activities }} activities</span>
        </div>
        <div class="text-body-2 mb-1">
          {{ formatDistance(sport.totals.distance) }} · {{ formatDuration(sport.totals.duration) }}
          · {{ formatElevation(sport.totals.elevation) }}
        </div>
        <div
          v-for="r in records(sport)"
          :key="r.label"
          class="d-flex align-center text-body-2 cursor-pointer record"
          @click="open(r.record.id)"
        >
          <v-icon class="mr-1" color="amber-darken-2" :icon="mdiTrophyOutline" size="x-small" />
          <span>{{ r.label }}</span>
          <v-spacer />
          <strong>{{ r.format(r.record.value) }}</strong>
          <span class="text-caption text-medium-emphasis ml-2">{{ formatDate(r.record.date) }}</span>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.record:hover {
  text-decoration: underline;
}
</style>
