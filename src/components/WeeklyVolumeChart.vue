<script setup lang="ts">
  import { computed } from 'vue'
  import type { PropType } from 'vue'
  import { Bar } from 'vue-chartjs'
  import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from 'chart.js'
  import type { ChartData, ChartOptions } from 'chart.js'
  import type { WeeklyVolume } from '@/types/dashboard'
  import { formatDistance, formatDuration, sportColor, sportLabel } from '@/utils/format'

  ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

  const props = defineProps({
    weeks: {
      type: Array as PropType<string[]>,
      required: true,
    },
    volumes: {
      type: Array as PropType<WeeklyVolume[]>,
      required: true,
    },
    metric: {
      type: String as PropType<'distance' | 'duration'>,
      required: true,
    },
  })

  // km or hours: the bars use round units, the tooltips the formatted values
  const toUnit = (v: WeeklyVolume) => props.metric === 'distance' ? v.distance / 1000 : v.duration / 3600
  const format = (v: number) => props.metric === 'distance' ? formatDistance(v * 1000) : formatDuration(v * 3600)

  const chartData = computed((): ChartData<'bar'> => {
    // one stacked dataset per sport, the most practiced at the bottom
    const totals = new Map<string, number>()
    for (const v of props.volumes) {
      totals.set(v.sport, (totals.get(v.sport) ?? 0) + toUnit(v))
    }
    const sports = [...totals.keys()].sort((a, b) => (totals.get(b) ?? 0) - (totals.get(a) ?? 0))
    return {
      labels: props.weeks.map(w => new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' }).format(new Date(w))),
      datasets: sports.map((sport, index) => ({
        label: sportLabel(sport),
        data: props.weeks.map(week => props.volumes
          .filter(v => v.week === week && v.sport === sport)
          .reduce((sum, v) => sum + toUnit(v), 0)),
        backgroundColor: sportColor(sport, index),
        borderRadius: 3,
      })),
    }
  })

  const options = computed((): ChartOptions<'bar'> => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'bottom' },
      tooltip: {
        callbacks: {
          title: items => `Week of ${items[0].label}`,
          label: item => `${item.dataset.label}: ${format(item.parsed.y)}`,
          footer: items => `Total: ${format(items.reduce((sum, i) => sum + i.parsed.y, 0))}`,
        },
        // sports without activity that week
        filter: item => item.parsed.y > 0,
      },
    },
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: { stacked: true, beginAtZero: true, title: { display: true, text: props.metric === 'distance' ? 'km' : 'hours' } },
    },
  }))
</script>

<template>
  <div class="weekly-chart">
    <Bar :data="chartData" :options="options" />
  </div>
</template>

<style scoped>
.weekly-chart {
  position: relative;
  height: 320px;
}
</style>
