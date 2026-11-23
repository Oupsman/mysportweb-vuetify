<script setup lang="ts">
  import { computed } from 'vue'
  import { Line } from 'vue-chartjs'
  import {
    Chart as ChartJS,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Tooltip,
  } from 'chart.js'
  import type { ChartData, ChartOptions } from 'chart.js'

  ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

  // series of two activities at the same distances (km); a gap chart fills above and below zero
  export interface CompareSeries {
    label: string
    color: string
    values: number[]
  }
  type Format = (value: number) => string
  const props = defineProps<{
    distances: number[]
    series: CompareSeries[]
    unit: string
    gap?: boolean
    format?: Format
  }>()

  const data = computed((): ChartData<'line'> => ({
    datasets: props.series.map(s => ({
      label: s.label,
      data: props.distances.map((x, i) => ({ x, y: s.values[i] })),
      borderColor: s.color,
      backgroundColor: s.color,
      borderWidth: 1.5,
      pointRadius: 0,
      // the gap: red where the second one is behind, green where it is ahead
      fill: props.gap ? { target: 'origin', above: 'rgba(211, 47, 47, 0.25)', below: 'rgba(56, 142, 60, 0.25)' } : false,
    })),
  }))

  const options = computed((): ChartOptions<'line'> => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: { type: 'linear', title: { display: true, text: 'km' }, ticks: { maxTicksLimit: 12 } },
      y: { title: { display: true, text: props.unit } },
    },
    plugins: {
      legend: { display: !props.gap },
      tooltip: {
        callbacks: {
          title: items => items.length ? `${(items[0].parsed.x).toFixed(2)} km` : '',
          label: item => `${item.dataset.label}: ${props.format ? props.format(item.parsed.y) : item.parsed.y.toFixed(1)}`,
        },
      },
    },
  }))
</script>

<template>
  <div class="compare-chart">
    <Line :data="data" :options="options" />
  </div>
</template>

<style scoped>
.compare-chart {
  height: 220px;
}
</style>
