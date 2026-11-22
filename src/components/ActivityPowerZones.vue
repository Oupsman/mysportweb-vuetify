<script setup lang="ts">
  import { computed } from 'vue'
  import { formatDuration } from '@/utils/format'
  import { powerZoneRange, powerZones } from '@/utils/zones'

  // zones: seconds in Z1 to Z7; bounds: 0, the lower limits of the zones 2 to 7 (W); ftp: the one they come from
  const props = defineProps<{ zones: number[], bounds: number[] | null, ftp: number }>()

  const total = computed(() => props.zones.reduce((sum, s) => sum + s, 0))
  const rows = computed(() => powerZones.map((zone, index) => {
    const seconds = props.zones[index] ?? 0
    return {
      ...zone,
      seconds,
      percent: total.value > 0 ? (seconds / total.value) * 100 : 0,
      range: props.bounds ? powerZoneRange(props.bounds, index) : '',
    }
  }))
  const time = (seconds: number) => seconds > 0 && seconds < 60 ? `${Math.round(seconds)} s` : formatDuration(seconds)
</script>

<template>
  <v-card>
    <v-card-item>
      <v-card-title>Power zones</v-card-title>
      <v-card-subtitle>By FTP, {{ ftp }} W at the date of the ride</v-card-subtitle>
    </v-card-item>
    <v-card-text>
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
  grid-template-columns: 3em 7.5em 7.5em 1fr 4.5em 3em;
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
/* phones: no watts range, the bar keeps the room left */
@media (max-width: 599px) {
  .zone-row {
    grid-template-columns: 3em 7em 1fr 4em 2.5em;
  }
  .zone-row > :nth-child(3) {
    display: none;
  }
}
</style>
