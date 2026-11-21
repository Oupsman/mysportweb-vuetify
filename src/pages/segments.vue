<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { mdiMapMarkerPath } from '@mdi/js'
  import { useSegmentsStore } from '@/stores/segments'
  import { formatClock, formatDate, formatDistance, formatElevation, sportColor, sportIcon } from '@/utils/format'

  const segmentsStore = useSegmentsStore()
  const loading = ref(true)
  const error = ref('')
  onMounted(async () => {
    try {
      await segmentsStore.getSegments()
    } catch (error_) {
      error.value = (error_ as Error).message
    } finally {
      loading.value = false
    }
  })
</script>

<template>
  <v-container class="pa-4" fluid>
    <h5 class="text-h5 mb-4">Segments</h5>
    <v-alert v-if="error" type="error" variant="tonal">{{ error }}</v-alert>
    <v-card v-else-if="!loading && segmentsStore.segments.length === 0" class="pa-8 text-center">
      <v-icon class="mb-2" color="deep-orange-darken-3" :icon="mdiMapMarkerPath" size="48" />
      <div class="text-body-1">No segment yet</div>
      <div class="text-body-2 text-medium-emphasis">
        Open one of your rides and choose <strong>New segment</strong> in its Segments card: a climb, a stretch of
        your commute. Your passes on it are then compared, in all your activities.
      </div>
    </v-card>
    <v-card v-else>
      <v-table hover>
        <thead>
          <tr>
            <th />
            <th>Name</th>
            <th class="text-right">Length</th>
            <th class="text-right d-none d-sm-table-cell">Climb</th>
            <th class="text-right">Passes</th>
            <th class="text-right">Best</th>
            <th class="text-right d-none d-md-table-cell">Last pass</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="segment in segmentsStore.segments"
            :key="segment.id"
            class="cursor-pointer"
            @click="$router.push(`/segment/${segment.id}`)"
          >
            <td><v-icon :color="sportColor(segment.sport)" :icon="sportIcon(segment.sport)" size="small" /></td>
            <td>{{ segment.name }}</td>
            <td class="text-right text-no-wrap">{{ formatDistance(segment.distance) }}</td>
            <td class="text-right text-no-wrap d-none d-sm-table-cell">{{ formatElevation(segment.elevation_gain) }}</td>
            <td class="text-right">{{ segment.efforts }}</td>
            <td class="text-right text-no-wrap">{{ segment.best !== null ? formatClock(segment.best) : '-' }}</td>
            <td class="text-right text-no-wrap d-none d-md-table-cell">{{ segment.last_date ? formatDate(segment.last_date) : '-' }}</td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </v-container>
</template>
