<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { mdiDeleteOutline, mdiPencilOutline } from '@mdi/js'
  import SegmentMap from '@/components/SegmentMap.vue'
  import { useAppStore } from '@/stores/app'
  import { useSegmentsStore } from '@/stores/segments'
  import type { Segment, SegmentEffort } from '@/types/segments'
  import { formatClock, formatDate, formatDistance, formatElevation, formatSpeedFor } from '@/utils/format'

  const route = useRoute('/segment/[id]')
  const router = useRouter()
  const appStore = useAppStore()
  const segmentsStore = useSegmentsStore()

  const segment = ref<Segment | null>(null)
  const efforts = ref<SegmentEffort[]>([])
  const error = ref('')
  const load = async () => {
    error.value = ''
    try {
      const data = await segmentsStore.getSegment(route.params.id)
      segment.value = data.segment
      efforts.value = data.efforts
      appStore.pageTitle = data.segment.name
    } catch (error_) {
      error.value = (error_ as Error).message
    }
  }
  watch(() => route.params.id, load, { immediate: true })

  const best = computed(() => efforts.value[0] ?? null)
  const speed = (effort: SegmentEffort) => formatSpeedFor(segment.value?.sport, effort.distance / effort.elapsed)
  // how much slower than the best, for the others
  const behind = (effort: SegmentEffort) => (best.value && effort.id !== best.value.id
    ? `+${formatClock(effort.elapsed - best.value.elapsed)}`
    : '')

  const renaming = ref(false)
  const newName = ref('')
  const busy = ref(false)
  const rename = async () => {
    if (!segment.value) return
    busy.value = true
    try {
      await segmentsStore.renameSegment(segment.value.id, newName.value.trim())
      segment.value.name = newName.value.trim()
      appStore.pageTitle = segment.value.name
      renaming.value = false
    } catch (error_) {
      error.value = (error_ as Error).message
    } finally {
      busy.value = false
    }
  }
  const remove = async () => {
    if (!segment.value || !confirm(`Delete the segment "${segment.value.name}"? Your activities are kept.`)) return
    busy.value = true
    try {
      await segmentsStore.deleteSegment(segment.value.id)
      router.push('/segments')
    } catch (error_) {
      error.value = (error_ as Error).message
      busy.value = false
    }
  }
</script>

<template>
  <v-container class="pa-4" fluid>
    <v-alert v-if="error" class="mb-3" type="error" variant="tonal">{{ error }}</v-alert>
    <template v-if="segment">
      <div class="d-flex align-center flex-wrap ga-2 mb-3">
        <h5 class="text-h5">{{ segment.name }}</h5>
        <v-spacer />
        <v-btn
          :prepend-icon="mdiPencilOutline"
          variant="tonal"
          @click="newName = segment.name; renaming = true"
        >Rename</v-btn>
        <v-btn
          color="error"
          :loading="busy"
          :prepend-icon="mdiDeleteOutline"
          variant="tonal"
          @click="remove"
        >Delete</v-btn>
      </div>
      <v-row>
        <v-col cols="12" md="7">
          <SegmentMap height="380px" :highlight="segment.points" :trace="[]" />
        </v-col>
        <v-col cols="12" md="5">
          <v-card class="h-100">
            <v-card-text>
              <div class="figures">
                <div><div class="text-caption">Length</div><div class="text-h6">{{ formatDistance(segment.distance) }}</div></div>
                <div><div class="text-caption">Climb</div><div class="text-h6">{{ formatElevation(segment.elevation_gain) }}</div></div>
                <div><div class="text-caption">Passes</div><div class="text-h6">{{ efforts.length }}</div></div>
              </div>
              <template v-if="best">
                <v-divider class="my-3" />
                <div class="text-caption">Your best</div>
                <div class="text-h4 font-weight-medium">{{ formatClock(best.elapsed) }}</div>
                <div class="text-body-2 text-medium-emphasis">
                  {{ speed(best) }} · {{ formatDate(best.date) }} ·
                  <router-link :to="`/activity/${best.activity_id}`">{{ best.activity_title }}</router-link>
                </div>
              </template>
              <div v-else class="text-body-2 text-medium-emphasis mt-3">No pass yet.</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      <v-card v-if="efforts.length > 0" class="mt-4">
        <v-card-title>Your passes</v-card-title>
        <v-table density="compact" hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th class="d-none d-sm-table-cell">Activity</th>
              <th class="text-right">Time</th>
              <th class="text-right d-none d-sm-table-cell" />
              <th class="text-right">Speed</th>
              <th class="text-right d-none d-md-table-cell">Heart rate</th>
              <th class="text-right d-none d-md-table-cell">Power</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="effort in efforts"
              :key="effort.id"
              class="cursor-pointer"
              @click="$router.push(`/activity/${effort.activity_id}`)"
            >
              <td>{{ effort.rank }}</td>
              <td class="text-no-wrap">{{ formatDate(effort.date) }}</td>
              <td class="d-none d-sm-table-cell">{{ effort.activity_title }}</td>
              <td class="text-right text-no-wrap font-weight-medium">{{ formatClock(effort.elapsed) }}</td>
              <td class="text-right text-no-wrap text-medium-emphasis d-none d-sm-table-cell">{{ behind(effort) }}</td>
              <td class="text-right text-no-wrap">{{ speed(effort) }}</td>
              <td class="text-right text-no-wrap d-none d-md-table-cell">{{ effort.avg_heart_rate ? `${effort.avg_heart_rate} bpm` : '-' }}</td>
              <td class="text-right text-no-wrap d-none d-md-table-cell">{{ effort.avg_power ? `${effort.avg_power} W` : '-' }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card>
    </template>

    <v-dialog v-model="renaming" max-width="480">
      <v-card title="Rename the segment">
        <v-card-text>
          <v-text-field v-model="newName" counter="100" label="Name" maxlength="100" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="renaming = false">Cancel</v-btn>
          <v-btn
            color="primary"
            :disabled="!newName.trim()"
            :loading="busy"
            variant="flat"
            @click="rename"
          >Rename</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.figures {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
</style>
