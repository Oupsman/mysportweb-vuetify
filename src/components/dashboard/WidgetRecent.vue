<script setup lang="ts">
  import ActivityThumbnail from '@/components/ActivityThumbnail.vue'
  import { useAppStore } from '@/stores/app'
  import { useUserStore } from '@/stores/user'
  import { formatDate, formatDistance, formatDuration, formatElevation, formatSpeed } from '@/utils/format'

  const userStore = useUserStore()
  const appStore = useAppStore()
  const open = (id: string) => appStore.navigateToPage(`/activity/${id}`)
</script>

<template>
  <v-card class="widget-card">
    <v-card-item>
      <v-card-title>Recent activities</v-card-title>
      <template #append>
        <v-btn size="small" variant="text" @click="appStore.navigateToPage('/activities')">All activities</v-btn>
      </template>
    </v-card-item>
    <v-table class="widget-scroll" density="compact" hover>
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
          v-for="activity in userStore.dashboard.recent"
          :key="activity.id"
          class="cursor-pointer"
          @click="open(activity.id)"
        >
          <td class="pr-0"><ActivityThumbnail :sport="activity.sport" :thumbnail="activity.thumbnail" /></td>
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
</template>
