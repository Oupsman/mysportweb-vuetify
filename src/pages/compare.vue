<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { mdiCircle } from '@mdi/js'
  import { useRoute } from 'vue-router'
  import CompareChart from '@/components/CompareChart.vue'
  import { useActivitiesStore } from '@/stores/activities'
  import { useAppStore } from '@/stores/app'
  import type { Activity } from '@/types/activities'
  import { compareActivities } from '@/utils/compare'
  import type { ComparedActivity } from '@/utils/compare'
  import { formatDate, formatDistance, formatDuration, formatSpeedFor } from '@/utils/format'

  // /compare?a=<id>&b=<id>: two activities on the same route, at the same distances from their start
  const route = useRoute()
  const activitiesStore = useActivitiesStore()
  const appStore = useAppStore()
  const first = ref<Activity | null>(null)
  const second = ref<Activity | null>(null)
  const error = ref('')
  const colors = ['rgb(25, 118, 210)', 'rgb(230, 81, 0)']

  // loaded again when the query changes: the page stays the same component from a pair to another
  const load = async (a: unknown, b: unknown) => {
    first.value = null
    second.value = null
    error.value = ''
    if (typeof a !== 'string' || typeof b !== 'string') {
      error.value = 'Choose two activities to compare, from the "Same route" list of an activity.'
      return
    }
    try {
      const [x, y] = await Promise.all([activitiesStore.getActivity(a), activitiesStore.getActivity(b)])
      // a later query won meanwhile
      if (route.query.a === a && route.query.b === b) {
        first.value = x
        second.value = y
      }
    } catch {
      error.value = 'The activities could not be loaded'
    }
  }
  watch(() => [route.query.a, route.query.b], ([a, b]) => load(a, b), { immediate: true })

  const comparison = computed(() => first.value && second.value
    ? compareActivities(first.value as unknown as ComparedActivity, second.value as unknown as ComparedActivity)
    : null)

  // "+0:12" behind, "−0:30" ahead
  const formatGap = (seconds: number): string => {
    const whole = Math.round(Math.abs(seconds))
    const text = `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
    return seconds > 0.5 ? `+${text}` : seconds < -0.5 ? `−${text}` : '0:00'
  }
  const label = (a: Activity) => `${formatDate(a.date)} · ${a.title}`
  const finalGap = computed(() => {
    const c = comparison.value
    return c && c.gap.length ? c.gap[c.gap.length - 1] : 0
  })
  const summary = computed(() => {
    const c = comparison.value
    if (!c || !first.value || !second.value) return ''
    const at = `at ${c.distances[c.distances.length - 1].toFixed(2)} km`
    const gap = finalGap.value
    if (Math.abs(gap) < 0.5) return `Level ${at}`
    return `${formatDate(second.value.date)} is ${formatGap(Math.abs(gap)).slice(1)} ${gap > 0 ? 'behind' : 'ahead'} ${at}`
  })
  const both = (x: number[] | null, y: number[] | null) => x !== null && y !== null
</script>

<template>
  <v-container>
    <h2 class="text-h4 mb-4">Compare</h2>
    <v-alert v-if="error" type="info" variant="tonal">{{ error }}</v-alert>
    <v-progress-linear v-else-if="!first || !second" indeterminate />
    <template v-else>
      <v-row>
        <v-col v-for="(a, i) in [first, second]" :key="a.id" cols="12" md="6">
          <v-card class="cursor-pointer" @click="appStore.navigateToPage(`/activity/${a.id}`)">
            <v-card-item>
              <template #prepend>
                <v-icon :color="colors[i]" :icon="mdiCircle" />
              </template>
              <v-card-title>{{ a.title }}</v-card-title>
              <v-card-subtitle>{{ formatDate(a.date) }}</v-card-subtitle>
            </v-card-item>
            <v-card-text class="d-flex flex-wrap ga-4">
              <span>{{ formatDistance(a.distance) }}</span>
              <span>{{ formatDuration(a.duration) }}</span>
              <span>{{ formatSpeedFor(a.sport, a.avg_speed) }}</span>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      <v-alert v-if="!comparison" class="mt-4" type="warning" variant="tonal">
        One of them has no distances recorded: they can't be compared.
      </v-alert>
      <template v-else>
        <v-card class="mt-4">
          <v-card-item>
            <v-card-title>Time gap</v-card-title>
            <v-card-subtitle>
              {{ summary }}. Above zero (red) the second one is behind, below (green) ahead.
            </v-card-subtitle>
          </v-card-item>
          <v-card-text>
            <CompareChart
              :distances="comparison.distances"
              :format="formatGap"
              gap
              :series="[{ label: label(second), color: colors[1], values: comparison.gap }]"
              unit="seconds"
            />
          </v-card-text>
        </v-card>
        <v-card v-if="both(comparison.speedA, comparison.speedB)" class="mt-4" title="Speed">
          <v-card-text>
            <CompareChart
              :distances="comparison.distances"
              :format="v => `${v.toFixed(1)} km/h`"
              :series="[
                { label: label(first), color: colors[0], values: comparison.speedA! },
                { label: label(second), color: colors[1], values: comparison.speedB! },
              ]"
              unit="km/h"
            />
          </v-card-text>
        </v-card>
        <v-card v-if="both(comparison.hrA, comparison.hrB)" class="mt-4" title="Heart rate">
          <v-card-text>
            <CompareChart
              :distances="comparison.distances"
              :format="v => `${Math.round(v)} bpm`"
              :series="[
                { label: label(first), color: colors[0], values: comparison.hrA! },
                { label: label(second), color: colors[1], values: comparison.hrB! },
              ]"
              unit="bpm"
            />
          </v-card-text>
        </v-card>
        <v-card v-if="both(comparison.powerA, comparison.powerB)" class="mt-4" title="Power">
          <v-card-text>
            <CompareChart
              :distances="comparison.distances"
              :format="v => `${Math.round(v)} W`"
              :series="[
                { label: label(first), color: colors[0], values: comparison.powerA! },
                { label: label(second), color: colors[1], values: comparison.powerB! },
              ]"
              unit="W"
            />
          </v-card-text>
        </v-card>
        <v-card v-if="comparison.altitude" class="mt-4" title="Altitude">
          <v-card-text>
            <CompareChart
              :distances="comparison.distances"
              :format="v => `${Math.round(v)} m`"
              :series="[{ label: label(first), color: 'rgb(144, 202, 249)', values: comparison.altitude }]"
              unit="m"
            />
          </v-card-text>
        </v-card>
        <div class="text-caption text-medium-emphasis mt-2">
          Lined up by the distance from their start: a different start point, or GPS drifting, shifts one against the other.
        </div>
      </template>
    </template>
  </v-container>
</template>
