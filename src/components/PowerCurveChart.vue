<script setup lang="ts">
  import { computed } from 'vue'
  import { Line } from 'vue-chartjs'
  import { Chart as ChartJS, Legend, LinearScale, LineElement, LogarithmicScale, PointElement, Tooltip } from 'chart.js'
  import type { ChartData, ChartOptions } from 'chart.js'
  import { curveDuration } from '@/utils/efforts'
  import { formatDate } from '@/utils/format'

  ChartJS.register(LinearScale, LogarithmicScale, PointElement, LineElement, Tooltip, Legend)

  // a curve: its points (watts, or W/kg with perKg), the ride of each point when it comes from several
  export interface CurveSeries {
    label: string
    color: string
    dashed?: boolean
    points: { duration: number, watts: number, watts_per_kg?: number | null, activity_id?: string,
              activity_title?: string, date?: string }[]
  }

  const props = defineProps<{
    series: CurveSeries[]
    perKg?: boolean
    ftp?: number // a horizontal line, in W
    cp?: number
    weight?: number // kg, the lines in W/kg
  }>()
  const emit = defineEmits<{ open: [activityId: string] }>()

  // the ticks of the time axis: the durations a rider thinks in
  const ticks = [1, 5, 15, 30, 60, 120, 300, 600, 1200, 1800, 3600, 7200, 18000]
  const value = (p: CurveSeries['points'][number]) => props.perKg ? (p.watts_per_kg ?? null) : p.watts
  const line = (y: number) => props.perKg ? (props.weight ? Math.round((y / props.weight) * 100) / 100 : null) : y

  const chartData = computed((): ChartData<'line'> => {
    const datasets: ChartData<'line'>['datasets'] = props.series.map(s => ({
      label: s.label,
      data: s.points.map(p => ({ x: p.duration, y: value(p) as number })),
      borderColor: s.color,
      backgroundColor: s.color,
      borderDash: s.dashed ? [6, 4] : [],
      pointRadius: 2,
      pointHoverRadius: 5,
      tension: 0.2,
      spanGaps: true,
    }))
    const horizontal = (label: string, y: number | undefined, color: string) => {
      const level = y ? line(y) : null
      if (level) {
        datasets.push({
          label,
          data: [{ x: 1, y: level }, { x: 18000, y: level }],
          borderColor: color,
          borderWidth: 1,
          borderDash: [2, 3],
          pointRadius: 0,
          pointHoverRadius: 0,
        })
      }
    }
    horizontal(`FTP ${props.ftp} W`, props.ftp, '#9e9e9e')
    horizontal(`CP ${props.cp} W`, props.cp, '#8e3ab8')
    return { datasets }
  })

  const lines = computed(() => props.series.length)
  const options = computed((): ChartOptions<'line'> => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    parsing: false,
    interaction: { mode: 'nearest', axis: 'x', intersect: false },
    onClick: (_event, elements) => {
      const element = elements.find(e => e.datasetIndex < lines.value)
      const point = element ? props.series[element.datasetIndex].points[element.index] : undefined
      if (point?.activity_id) emit('open', point.activity_id)
    },
    plugins: {
      legend: { position: 'bottom' },
      tooltip: {
        filter: item => item.datasetIndex < lines.value,
        callbacks: {
          title: items => curveDuration(items[0].parsed.x),
          label: item => {
            const p = props.series[item.datasetIndex].points[item.dataIndex]
            const y = props.perKg ? `${item.parsed.y.toFixed(2)} W/kg` : `${Math.round(item.parsed.y)} W`
            const from = p.activity_title && p.date ? ` · ${p.activity_title}, ${formatDate(p.date)}` : ''
            return `${props.series[item.datasetIndex].label}: ${y}${from}`
          },
        },
      },
    },
    scales: {
      x: {
        type: 'logarithmic',
        min: 1,
        max: 18000,
        afterBuildTicks: axis => {
          axis.ticks = ticks.map(v => ({ value: v }))
        },
        ticks: { callback: v => curveDuration(Number(v)) },
        grid: { color: 'rgba(128,128,128,0.15)' },
      },
      y: {
        beginAtZero: false,
        title: { display: true, text: props.perKg ? 'W/kg' : 'W' },
        grid: { color: 'rgba(128,128,128,0.15)' },
      },
    },
  }))
</script>

<template>
  <div class="curve-chart">
    <Line :data="chartData" :options="options" />
  </div>
</template>

<style scoped>
.curve-chart {
  position: relative;
  height: 360px;
}
</style>
