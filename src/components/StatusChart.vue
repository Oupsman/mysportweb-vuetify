<script setup lang="ts">
  import { computed } from 'vue'
  import { Line } from 'vue-chartjs'
  import { CategoryScale, Chart as ChartJS, Filler, LinearScale, LineElement, PointElement, Tooltip } from 'chart.js'
  import type { ChartData, ChartOptions } from 'chart.js'

  ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

  // a small chart of the last day: one or two series over the same labels (HH:MM)
  type Format = (value: number) => string
  type Values = Array<number | null>
  interface Series {
    label: string
    color: string
    values: Values
    fill?: boolean
  }
  const props = defineProps<{
    title: string
    labels: string[]
    series: Series[]
    format: Format
  }>()

  const data = computed((): ChartData<'line'> => ({
    labels: props.labels,
    datasets: props.series.map(s => ({
      label: s.label,
      data: s.values,
      borderColor: s.color,
      backgroundColor: s.color.replace('rgb', 'rgba').replace(')', ', 0.15)'),
      borderWidth: 1.5,
      pointRadius: 0,
      fill: s.fill ? 'origin' : false,
      spanGaps: true,
    })),
  }))
  const options = computed((): ChartOptions<'line'> => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: { ticks: { maxTicksLimit: 6, maxRotation: 0 } },
      y: { beginAtZero: true, ticks: { maxTicksLimit: 4, callback: v => props.format(Number(v)) } },
    },
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: item => `${item.dataset.label}: ${props.format(item.parsed.y)}` } },
    },
  }))
</script>

<template>
  <div>
    <div class="text-caption text-medium-emphasis">{{ title }}</div>
    <div class="status-chart">
      <Line :data="data" :options="options" />
    </div>
  </div>
</template>

<style scoped>
.status-chart {
  height: 140px;
}
</style>
