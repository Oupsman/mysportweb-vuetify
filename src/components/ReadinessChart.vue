<script setup lang="ts">
  import 'chartjs-adapter-date-fns'
  import { computed } from 'vue'
  import { Line } from 'vue-chartjs'
  import { Chart as ChartJS, Filler, Legend, LinearScale, LineElement, PointElement, TimeScale, Tooltip } from 'chart.js'
  import type { ChartData, ChartOptions } from 'chart.js'
  import type { ReadinessDay } from '@/types/training'

  ChartJS.register(LinearScale, TimeScale, PointElement, LineElement, Filler, Tooltip, Legend)

  const props = defineProps<{ series: ReadinessDay[] }>()

  // the days are dates of the user's timezone: noon keeps them on their day in any browser timezone
  const time = (date: string) => new Date(`${date}T12:00:00`).getTime()

  // fitness and fatigue: the validated blue and orange pair; the form, their difference, a recessive gray area
  const line = (label: string, color: string, value: (d: ReadinessDay) => number) => ({
    label,
    data: props.series.map(d => ({ x: time(d.date), y: value(d) })),
    borderColor: color,
    backgroundColor: color,
    borderWidth: 2,
    pointRadius: 0,
    pointHoverRadius: 4,
    tension: 0.2,
  })
  const chartData = computed((): ChartData<'line', { x: number, y: number }[]> => ({
    datasets: [
      line('Fitness', '#2a78d6', d => d.fitness),
      line('Fatigue', '#eb6834', d => d.fatigue),
      {
        ...line('Form', '#78909c', d => d.form),
        backgroundColor: 'rgba(120, 144, 156, 0.2)',
        borderWidth: 1,
        fill: 'origin',
      },
    ],
  }))

  const options = computed((): ChartOptions<'line'> => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'bottom' },
      tooltip: {
        callbacks: {
          title: items => new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
            .format(new Date(items[0].parsed.x)),
          label: item => `${item.dataset.label}: ${Math.round(item.parsed.y)}`,
        },
      },
    },
    scales: {
      x: { type: 'time', time: { unit: 'week', tooltipFormat: 'dd/MM/yyyy', displayFormats: { week: 'dd/MM' } }, grid: { display: false } },
      y: { title: { display: true, text: 'training load / day' } },
    },
  }))
</script>

<template>
  <div class="readiness-chart">
    <Line :data="chartData" :options="options" />
  </div>
</template>

<style scoped>
.readiness-chart {
  position: relative;
  height: 260px;
}
</style>
