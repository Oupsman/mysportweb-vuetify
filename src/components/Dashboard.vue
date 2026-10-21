<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import {
    mdiCalendarCheck,
    mdiImageFilterHdr,
    mdiMapMarkerDistance,
    mdiTimerOutline,
    mdiTrophyOutline,
    mdiUpload,
  } from '@mdi/js'
  import ActivityMonth from '@/components/ActivityMonth.vue'
  import WeeklyVolumeChart from '@/components/WeeklyVolumeChart.vue'
  import { useUserStore } from '@/stores/user'
  import { useAppStore } from '@/stores/app'
  import type { PeriodTotals, SportRecord, SportSummary } from '@/types/dashboard'
  import {
    formatDate,
    formatDistance,
    formatDuration,
    formatElevation,
    formatSpeed,
    sportColor,
    sportIcon,
    sportLabel,
  } from '@/utils/format'

  const userStore = useUserStore()
  const appStore = useAppStore()
  const dashboard = computed(() => userStore.dashboard)
  const hasActivities = computed(() => dashboard.value.totals.all_time.activities > 0)

  onMounted(() => {
    userStore.refreshDashboard().catch(() => {})
  })

  const open = (id: string) => appStore.navigateToPage(`/activity/${id}`)

  // one tile per measure, comparing the current periods with the previous ones
  type Measure = keyof PeriodTotals
  const tiles: { measure: Measure, title: string, icon: string, format: (v: number) => string }[] = [
    { measure: 'distance', title: 'Distance', icon: mdiMapMarkerDistance, format: formatDistance },
    { measure: 'duration', title: 'Time', icon: mdiTimerOutline, format: formatDuration },
    { measure: 'elevation', title: 'Elevation', icon: mdiImageFilterHdr, format: formatElevation },
    { measure: 'activities', title: 'Activities', icon: mdiCalendarCheck, format: v => String(v) },
  ]

  const metric = ref<'distance' | 'duration'>('distance')

  // records of a sport, with their unit
  const records = (sport: SportSummary) => [
    { label: 'Longest distance', record: sport.longest_distance, format: formatDistance },
    { label: 'Longest duration', record: sport.longest_duration, format: formatDuration },
    { label: 'Biggest climb', record: sport.biggest_climb, format: formatElevation },
  ].filter((r): r is { label: string, record: SportRecord, format: (v: number) => string } => r.record !== null)

</script>

<template>
  <v-container v-if="userStore.userIsLoggedIn" class="pa-4" fluid>
    <v-alert
      v-if="dashboard.nb_equipments === 0"
      class="mb-4"
      density="compact"
      type="info"
      variant="tonal"
    >
      Add your equipment to follow its mileage.
      <template #append>
        <v-btn size="small" variant="text" @click="appStore.navigateToPage('/equipment/add')">Add an equipment</v-btn>
      </template>
    </v-alert>

    <v-card v-if="!hasActivities" class="pa-8 text-center">
      <v-card-title class="text-h5">No activity yet</v-card-title>
      <v-card-text>Upload your FIT files to see your training here.</v-card-text>
      <v-btn color="primary" :prepend-icon="mdiUpload" @click="appStore.navigateToPage('/activity/add')">
        Upload activities
      </v-btn>
    </v-card>

    <template v-else>
      <!-- totals: this week, compared with the previous periods -->
      <v-row dense>
        <v-col
          v-for="tile in tiles"
          :key="tile.measure"
          cols="12"
          lg="3"
          sm="6"
        >
          <v-card class="h-100">
            <v-card-item>
              <template #prepend>
                <v-icon color="primary" :icon="tile.icon" />
              </template>
              <v-card-title>{{ tile.title }}</v-card-title>
              <v-card-subtitle>This week</v-card-subtitle>
            </v-card-item>
            <v-card-text>
              <div class="text-h4 font-weight-medium">{{ tile.format(dashboard.totals.this_week[tile.measure]) }}</div>
              <div class="text-caption text-medium-emphasis mb-2">
                last week {{ tile.format(dashboard.totals.last_week[tile.measure]) }}
              </div>
              <v-divider class="mb-2" />
              <div class="d-flex justify-space-between text-body-2">
                <span>This month</span>
                <span>
                  <strong>{{ tile.format(dashboard.totals.this_month[tile.measure]) }}</strong>
                  <span class="text-medium-emphasis"> / last {{ tile.format(dashboard.totals.last_month[tile.measure]) }}</span>
                </span>
              </div>
              <div class="d-flex justify-space-between text-body-2">
                <span>This year</span>
                <strong>{{ tile.format(dashboard.totals.this_year[tile.measure]) }}</strong>
              </div>
              <div class="d-flex justify-space-between text-body-2">
                <span>All time</span>
                <strong>{{ tile.format(dashboard.totals.all_time[tile.measure]) }}</strong>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row dense>
        <v-col cols="12" lg="8">
          <v-card class="h-100">
            <v-card-item>
              <v-card-title>Last {{ dashboard.week_starts.length }} weeks</v-card-title>
              <template #append>
                <v-btn-toggle
                  v-model="metric"
                  color="primary"
                  density="compact"
                  mandatory
                  variant="outlined"
                >
                  <v-btn value="distance">Distance</v-btn>
                  <v-btn value="duration">Time</v-btn>
                </v-btn-toggle>
              </template>
            </v-card-item>
            <v-card-text>
              <WeeklyVolumeChart :metric="metric" :volumes="dashboard.weekly" :weeks="dashboard.week_starts" />
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" lg="4">
          <v-card class="h-100">
            <v-card-title>Calendar</v-card-title>
            <v-card-text>
              <ActivityMonth :activities="dashboard.calendar" @open="open" />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row dense>
        <v-col cols="12" lg="8">
          <v-card class="h-100">
            <v-card-item>
              <v-card-title>Recent activities</v-card-title>
              <template #append>
                <v-btn size="small" variant="text" @click="appStore.navigateToPage('/activities')">All activities</v-btn>
              </template>
            </v-card-item>
            <v-table density="compact" hover>
              <thead>
                <tr>
                  <th />
                  <th>Date</th>
                  <!-- phones: only sport, date, distance and time -->
                  <th class="d-none d-sm-table-cell">Title</th>
                  <th class="text-right">Distance</th>
                  <th class="text-right">Time</th>
                  <th class="text-right d-none d-sm-table-cell">Speed</th>
                  <th class="text-right d-none d-sm-table-cell">Elevation</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="activity in dashboard.recent"
                  :key="activity.id"
                  class="cursor-pointer"
                  @click="open(activity.id)"
                >
                  <td><v-icon :color="sportColor(activity.sport)" :icon="sportIcon(activity.sport)" size="small" /></td>
                  <td class="text-no-wrap">{{ formatDate(activity.date) }}</td>
                  <td class="d-none d-sm-table-cell">{{ activity.title }}</td>
                  <td class="text-right text-no-wrap">{{ formatDistance(activity.distance) }}</td>
                  <td class="text-right text-no-wrap">{{ formatDuration(activity.duration) }}</td>
                  <td class="text-right text-no-wrap d-none d-sm-table-cell">{{ formatSpeed(activity.avg_speed) }}</td>
                  <td class="text-right text-no-wrap d-none d-sm-table-cell">{{ formatElevation(activity.elevation) }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-card>
        </v-col>
        <v-col cols="12" lg="4">
          <v-card class="h-100">
            <v-card-title>By sport</v-card-title>
            <v-card-text>
              <div v-for="(sport, index) in dashboard.sports" :key="sport.sport" :class="{ 'mt-4': index > 0 }">
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
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<style scoped>
.record:hover {
  text-decoration: underline;
}
</style>
