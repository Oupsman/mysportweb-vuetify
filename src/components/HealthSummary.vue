<script setup lang="ts">
  import { computed } from 'vue'
  import { mdiArrowDown, mdiArrowUp, mdiMinus } from '@mdi/js'
  import type { HealthData } from '@/types/health'
  import { formatHealthValue, formatMeasureDate, measuredMetrics } from '@/utils/health'
  import type { HealthMetric } from '@/utils/health'

  // most recent first
  const props = defineProps<{ datas: HealthData[] }>()

  // the latest measure of each metric, and its change since the measure before
  const tiles = computed(() => measuredMetrics(props.datas).map(metric => {
    const field = metric.values[0].field
    const [latest, previous] = props.datas.filter(d => d[field] > 0)
    return { metric, latest, change: previous ? latest[field] - previous[field] : null }
  }))

  const trend = (metric: HealthMetric, change: number | null) => {
    if (change === null) {
      return null
    }
    const rounded = Number(change.toFixed(metric.decimals))
    if (rounded === 0) {
      return { icon: mdiMinus, text: 'unchanged', color: undefined }
    }
    // good or bad only for the metrics where the direction means something
    const good = metric.lowerIsBetter === undefined ? undefined : (rounded < 0) === metric.lowerIsBetter
    return {
      icon: rounded > 0 ? mdiArrowUp : mdiArrowDown,
      // blood pressure: the change of the first value, named
      text: `${metric.values.length > 1 ? `${metric.values[0].label.toLowerCase()} ` : ''}` +
        `${rounded > 0 ? '+' : ''}${rounded.toLocaleString('fr-FR')} ${metric.unit}`,
      color: good === undefined ? undefined : good ? 'success' : 'error',
    }
  }
</script>

<template>
  <v-row>
    <v-col
      v-for="tile in tiles"
      :key="tile.metric.key"
      cols="6"
      lg="3"
      md="4"
    >
      <v-card class="h-100" variant="tonal">
        <v-card-text>
          <div class="text-caption text-medium-emphasis">{{ tile.metric.title }}</div>
          <div class="text-h5 font-weight-medium">
            {{ formatHealthValue(tile.metric, tile.latest) }}
            <span class="text-body-2 text-medium-emphasis">{{ tile.metric.unit }}</span>
          </div>
          <div class="d-flex align-center flex-wrap ga-1 text-caption">
            <span class="text-medium-emphasis">{{ formatMeasureDate(tile.latest.date) }}</span>
            <template v-if="trend(tile.metric, tile.change)">
              <v-icon
                :color="trend(tile.metric, tile.change)?.color"
                :icon="trend(tile.metric, tile.change)!.icon"
                size="x-small"
              />
              <span>{{ trend(tile.metric, tile.change)!.text }}</span>
            </template>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>
