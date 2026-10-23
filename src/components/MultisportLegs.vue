<script setup lang="ts">
  import { computed } from 'vue'
  import { mdiSwapHorizontal } from '@mdi/js'
  import type { Leg } from '@/types/activities'
  import { formatDistance, formatDuration, formatSpeed, sportColor, sportIcon, sportLabel } from '@/utils/format'

  const props = defineProps<{ legs: Leg[] }>()

  // the transitions are not legs: they are shown as their own row before the leg they lead to
  const rows = computed(() => props.legs.map((leg, i) => ({
    leg,
    // T1 before the second leg, T2 before the third...
    transition: leg.transition_time > 0 ? `T${i}` : '',
  })))

  // "1h 05" and "42 min" hide the seconds, which matter for a transition or a short leg
  const formatTime = (seconds: number): string => {
    const total = Math.round(seconds)
    const hours = Math.floor(total / 3600)
    const minutes = Math.floor((total % 3600) / 60)
    const rest = String(total % 60).padStart(2, '0')
    return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${rest}` : `${minutes}:${rest}`
  }

  // what athletes read for each sport: pace per 100 m swimming, per km running, speed otherwise
  const formatLegSpeed = (leg: Leg): string => {
    if (leg.avg_speed <= 0) {
      return ''
    }
    if (leg.sport === 'swimming') {
      return `${formatTime(100 / leg.avg_speed)} /100m`
    }
    if (leg.sport === 'running' || leg.sport === 'walking') {
      return `${formatTime(1000 / leg.avg_speed)} /km`
    }
    return formatSpeed(leg.avg_speed)
  }
</script>

<template>
  <v-card>
    <v-card-title>Legs</v-card-title>
    <v-table density="compact">
      <thead>
        <tr>
          <th>Sport</th>
          <th class="text-right">Time</th>
          <th class="text-right">Distance</th>
          <th class="text-right">Pace</th>
          <!-- phones: sport, time, distance and pace -->
          <th class="text-right d-none d-sm-table-cell">Heart rate</th>
          <th class="text-right d-none d-md-table-cell">Power</th>
          <th class="text-right d-none d-md-table-cell">Climb</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="row in rows" :key="row.leg.start_offset">
          <tr v-if="row.transition" class="text-medium-emphasis">
            <td><v-icon class="mr-2" :icon="mdiSwapHorizontal" size="small" />{{ row.transition }}</td>
            <td class="text-right">{{ formatTime(row.leg.transition_time) }}</td>
            <td colspan="2" />
            <td class="d-none d-sm-table-cell" />
            <td class="d-none d-md-table-cell" colspan="2" />
          </tr>
          <tr>
            <td class="text-no-wrap">
              <v-icon class="mr-2" :color="sportColor(row.leg.sport)" :icon="sportIcon(row.leg.sport)" size="small" />
              {{ sportLabel(row.leg.sport) }}
            </td>
            <td class="text-right text-no-wrap">
              {{ row.leg.duration >= 3600 ? formatDuration(row.leg.duration) : formatTime(row.leg.duration) }}
            </td>
            <td class="text-right text-no-wrap">{{ row.leg.distance > 0 ? formatDistance(row.leg.distance) : '' }}</td>
            <td class="text-right text-no-wrap">{{ formatLegSpeed(row.leg) }}</td>
            <td class="text-right text-no-wrap d-none d-sm-table-cell">{{ row.leg.avg_hr > 0 ? `${row.leg.avg_hr} bpm` : '' }}</td>
            <td
              class="text-right text-no-wrap d-none d-md-table-cell"
              :title="row.leg.power_estimated ? 'Estimated from the speed and the slope, no power meter' : undefined"
            >
              <template v-if="row.leg.avg_power > 0">{{ row.leg.power_estimated ? '~' : '' }}{{ row.leg.avg_power }} W</template>
            </td>
            <td class="text-right text-no-wrap d-none d-md-table-cell">{{ row.leg.ascent > 0 ? `${row.leg.ascent} m` : '' }}</td>
          </tr>
        </template>
      </tbody>
    </v-table>
  </v-card>
</template>
