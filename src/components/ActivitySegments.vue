<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { mdiMapMarkerPath, mdiPlus } from '@mdi/js'
  import SegmentCreator from '@/components/SegmentCreator.vue'
  import { useSegmentsStore } from '@/stores/segments'
  import type { Point } from '@/types/activities'
  import type { SegmentEffort } from '@/types/segments'
  import { formatClock, formatDistance } from '@/utils/format'

  // the passes of an activity of the user on their segments, and the creation of one from its trace
  const props = defineProps<{ activityId: string, points: Point[], stamps: number[] }>()
  const segmentsStore = useSegmentsStore()
  const efforts = ref<SegmentEffort[]>([])
  const error = ref('')
  const creating = ref(false)
  const canCreate = computed(() => props.points.length > 1 && props.stamps.length === props.points.length)

  onMounted(async () => {
    try {
      efforts.value = await segmentsStore.getActivityEfforts(props.activityId)
    } catch (error_) {
      error.value = (error_ as Error).message
    }
  })

  // the podium of the passes on a segment
  const medal = (rank: number) => (rank === 1 ? { color: 'amber-darken-2', text: 'Best' } : rank === 2
    ? { color: 'blue-grey-lighten-1', text: '2nd' }
    : rank === 3 ? { color: 'brown-lighten-1', text: '3rd' } : null)
</script>

<template>
  <v-card>
    <v-card-item>
      <template #prepend>
        <v-icon color="deep-orange-darken-3" :icon="mdiMapMarkerPath" />
      </template>
      <v-card-title>Segments</v-card-title>
      <v-card-subtitle>Your passes on your segments in this activity</v-card-subtitle>
      <template #append>
        <v-btn
          v-if="canCreate"
          :prepend-icon="mdiPlus"
          size="small"
          variant="tonal"
          @click="creating = true"
        >New segment</v-btn>
      </template>
    </v-card-item>
    <v-card-text>
      <v-alert v-if="error" density="compact" type="error" variant="tonal">{{ error }}</v-alert>
      <div v-else-if="efforts.length === 0" class="text-body-2 text-medium-emphasis">
        No pass on your segments. Create one from a stretch of this ride: a climb, a stretch of your commute.
      </div>
      <v-table v-else density="compact">
        <thead>
          <tr>
            <th>Segment</th>
            <th class="text-right">Length</th>
            <th class="text-right">Time</th>
            <th class="text-right">Rank</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="effort in efforts" :key="effort.id">
            <td><router-link :to="`/segment/${effort.segment_id}`">{{ effort.segment_name }}</router-link></td>
            <td class="text-right text-no-wrap">{{ formatDistance(effort.distance) }}</td>
            <td class="text-right text-no-wrap">{{ formatClock(effort.elapsed) }}</td>
            <td class="text-right text-no-wrap">
              <v-chip
                v-if="medal(effort.rank)"
                class="mr-1"
                :color="medal(effort.rank)!.color"
                size="x-small"
                variant="flat"
              >{{ medal(effort.rank)!.text }}</v-chip>
              {{ effort.rank }} / {{ effort.efforts }}
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
    <SegmentCreator
      v-if="canCreate"
      v-model="creating"
      :activity-id="activityId"
      :points="points"
      :stamps="stamps"
    />
  </v-card>
</template>
