<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import SegmentMap from '@/components/SegmentMap.vue'
  import { useSegmentsStore } from '@/stores/segments'
  import type { Point } from '@/types/activities'
  import { formatClock, formatDistance } from '@/utils/format'
  import { cumulativeDistances, indexAtDistance } from '@/utils/geo'

  // a dialog selecting a stretch of the trace of an activity of the user, saved as a segment
  const props = defineProps<{ activityId: string, points: Point[], stamps: number[] }>()
  const open = defineModel<boolean>({ default: false })

  const segmentsStore = useSegmentsStore()
  const router = useRouter()

  // the slider in meters along the trace, the segment between the points closest to its handles
  const distances = computed(() => cumulativeDistances(props.points))
  const total = computed(() => distances.value[distances.value.length - 1] ?? 0)
  const range = ref<[number, number]>([0, 0])
  const name = ref('')
  const saving = ref(false)
  const error = ref('')
  // a third of the ride in its middle to start with
  watch(open, isOpen => {
    if (isOpen) {
      range.value = [Math.round(total.value / 3), Math.round((total.value * 2) / 3)]
      name.value = ''
      error.value = ''
    }
  }, { immediate: true })

  const start = computed(() => indexAtDistance(distances.value, range.value[0]))
  const end = computed(() => indexAtDistance(distances.value, range.value[1]))
  const stretch = computed(() => props.points.slice(start.value, end.value + 1))
  const length = computed(() => distances.value[end.value] - distances.value[start.value])
  const time = computed(() => (props.stamps.length === props.points.length ? props.stamps[end.value] - props.stamps[start.value] : null))
  const tooShort = computed(() => length.value < 200)
  const tooLong = computed(() => length.value > 100_000)

  const map = ref<InstanceType<typeof SegmentMap>>()
  const save = async () => {
    saving.value = true
    error.value = ''
    try {
      const segment = await segmentsStore.createSegment(props.activityId, start.value, end.value, name.value.trim())
      open.value = false
      router.push(`/segment/${segment.id}`)
    } catch (error_) {
      error.value = (error_ as Error).message
    } finally {
      saving.value = false
    }
  }
</script>

<template>
  <v-dialog v-model="open" max-width="900">
    <v-card>
      <v-card-title>New segment</v-card-title>
      <v-card-subtitle>Select a stretch of this ride: your passes on it, in this ride and the others, are compared</v-card-subtitle>
      <v-card-text>
        <SegmentMap ref="map" height="360px" :highlight="stretch" :trace="points" />
        <v-range-slider
          v-model="range"
          class="mt-4"
          color="deep-orange-darken-3"
          hide-details
          :max="Math.round(total)"
          :min="0"
          :step="10"
          strict
          @end="map?.fit()"
        />
        <div class="d-flex flex-wrap ga-4 text-body-2 mb-3">
          <span>From <strong>{{ formatDistance(distances[start]) }}</strong> to <strong>{{ formatDistance(distances[end]) }}</strong></span>
          <span>Length <strong>{{ formatDistance(length) }}</strong></span>
          <span v-if="time !== null">In this ride <strong>{{ formatClock(time) }}</strong></span>
        </div>
        <v-text-field
          v-model="name"
          counter="100"
          density="comfortable"
          label="Name"
          maxlength="100"
          placeholder="The climb to the castle"
        />
        <v-alert v-if="tooShort || tooLong" density="compact" type="info" variant="tonal">
          A segment is between 200 m and 100 km long.
        </v-alert>
        <v-alert
          v-if="error"
          class="mt-2"
          density="compact"
          type="error"
          variant="tonal"
        >{{ error }}</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn :disabled="saving" variant="text" @click="open = false">Cancel</v-btn>
        <v-btn
          color="primary"
          :disabled="!name.trim() || tooShort || tooLong"
          :loading="saving"
          variant="flat"
          @click="save"
        >Create</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
