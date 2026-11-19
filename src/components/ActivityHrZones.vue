<script setup lang="ts">
  import { computed } from 'vue'
  import { formatDuration } from '@/utils/format'
  import { hrZones, zoneRange } from '@/utils/zones'

  // zones: seconds in Z1 to Z5; bounds: rest, lower limits of the zones 2 to 5, max (bpm)
  const props = defineProps<{ zones: number[], bounds: number[] | null }>()

  const total = computed(() => props.zones.reduce((sum, s) => sum + s, 0))
  const rows = computed(() => hrZones.map((zone, index) => {
    const seconds = props.zones[index] ?? 0
    return {
      ...zone,
      seconds,
      percent: total.value > 0 ? (seconds / total.value) * 100 : 0,
      range: props.bounds ? zoneRange(props.bounds, index) : '',
    }
  }))
  // a short zone still shows its time: under a minute, formatDuration says "0 min"
  const time = (seconds: number) => seconds > 0 && seconds < 60 ? `${Math.round(seconds)} s` : formatDuration(seconds)
</script>

<template>
  <v-card>
    <v-card-item>
      <v-card-title>Heart rate zones</v-card-title>
      <v-card-subtitle v-if="bounds">
        By heart rate reserve, resting {{ bounds[0] }} bpm, max {{ bounds[bounds.length - 1] }} bpm
      </v-card-subtitle>
    </v-card-item>
    <v-card-text>
      <!-- the whole activity at a glance, then each zone -->
      <div class="zones-bar mb-3">
        <div
          v-for="row in rows.filter(r => r.percent > 0)"
          :key="row.name"
          :style="{ width: `${row.percent}%`, backgroundColor: row.color }"
          :title="`${row.name} ${row.label}: ${time(row.seconds)}`"
        />
      </div>
      <div v-for="row in rows" :key="row.name" class="zone-row text-body-2">
        <span class="font-weight-medium">
          <span class="swatch" :style="{ backgroundColor: row.color }" />{{ row.name }}
        </span>
        <span>{{ row.label }}</span>
        <span class="text-medium-emphasis text-no-wrap">{{ row.range }}</span>
        <v-progress-linear
          bg-color="surface-variant"
          :color="row.color"
          height="8"
          :model-value="row.percent"
          rounded
        />
        <span class="text-right text-no-wrap">{{ time(row.seconds) }}</span>
        <span class="text-right text-medium-emphasis">{{ Math.round(row.percent) }}%</span>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.zones-bar {
  display: flex;
  height: 14px;
  border-radius: 7px;
  overflow: hidden;
  gap: 2px;
}
.zone-row {
  display: grid;
  grid-template-columns: 3em 6.5em 7.5em 1fr 4.5em 3em;
  align-items: center;
  gap: 8px;
  padding: 2px 0;
}
.swatch {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  margin-right: 6px;
}
/* phones: no bpm range, the bar keeps the room left */
@media (max-width: 599px) {
  .zone-row {
    grid-template-columns: 3em 6em 1fr 4em 2.5em;
  }
  .zone-row > :nth-child(3) {
    display: none;
  }
}
</style>
