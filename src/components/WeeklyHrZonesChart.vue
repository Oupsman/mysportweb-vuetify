<script setup lang="ts">
  import { computed } from 'vue'
  import type { PropType } from 'vue'
  import { Bar } from 'vue-chartjs'
  import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from 'chart.js'
  import type { ChartData, ChartOptions } from 'chart.js'
  import type { HrZonesWeeks } from '@/types/training'
  import { formatDuration } from '@/utils/format'
  import { hrZones, zonePercent } from '@/utils/zones'

  ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

  const props = defineProps({
    data: {
      type: Object as PropType<HrZonesWeeks>,
      required: true,
    },
  })

  // hours on the axis, the formatted durations in the tooltips
  const chartData = computed((): ChartData<'bar'> => ({
    labels: props.data.weeks.map(w =>
      new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' }).format(new Date(w.week))),
    // Z1 at the bottom: the easy base the harder zones stack on
    datasets: hrZones.map((zone, index) => ({
      label: `${zone.name} ${zone.label}`,
      data: props.data.weeks.map(w => (w.zones[index] ?? 0) / 3600),
      backgroundColor: zone.color,
      borderRadius: 3,
    })),
  }))

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
          label: item => `${item.dataset.label} (${zonePercent(props.data.limits, item.datasetIndex)}): ` +
            formatDuration(item.parsed.y * 3600),
          footer: items => {
            const total = items.reduce((sum, i) => sum + i.parsed.y, 0)
            // the share of the easy zones, the base of a polarized training
            const easy = items.filter(i => i.datasetIndex <= 1).reduce((sum, i) => sum + i.parsed.y, 0)
            return `Total: ${formatDuration(total * 3600)}, ${Math.round((easy / total) * 100)}% in Z1–Z2`
          },
        },
        filter: item => item.parsed.y > 0,
      },
    },
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: { stacked: true, beginAtZero: true, title: { display: true, text: 'hours' } },
    },
  }))
</script>

<template>
  <div class="zones-chart">
    <Bar :data="chartData" :options="options" />
  </div>
</template>

<style scoped>
.zones-chart {
  position: relative;
  height: 320px;
}
</style>
