<script setup lang="ts">
  import 'chartjs-adapter-date-fns'
  import { computed, ref, watch } from 'vue'
  import { Line } from 'vue-chartjs'
  import { Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, TimeScale, Tooltip } from 'chart.js'
  import type { ChartData, ChartOptions } from 'chart.js'
  import type { HealthData } from '@/types/health'
  import { formatMeasureDate, measuredMetrics } from '@/utils/health'

  ChartJS.register(LinearScale, TimeScale, PointElement, LineElement, Tooltip, Legend)

  const props = defineProps<{ datas: HealthData[] }>()

  // one metric at a time: their units differ, they never share an axis
  const metrics = computed(() => measuredMetrics(props.datas))
  const selected = ref('')
  watch(metrics, all => {
    if (!all.some(m => m.key === selected.value)) {
      selected.value = all[0]?.key ?? ''
    }
  }, { immediate: true })
  const metric = computed(() => metrics.value.find(m => m.key === selected.value))

  // the app's primary for one series; systolic and diastolic: the validated blue and orange pair
  const colors = ['#2a78d6', '#eb6834']
  const color = (index: number) => metric.value && metric.value.values.length > 1 ? colors[index] : '#257800'

  const periods = [
    { title: '3 months', value: 3 },
    { title: '1 year', value: 12 },
    { title: 'All', value: 0 },
  ]
  const months = ref(12)

  const chartData = computed((): ChartData<'line', { x: number, y: number }[]> => {
    const from = new Date()
    from.setMonth(from.getMonth() - months.value)
    const inPeriod = props.datas.filter(d => months.value === 0 || new Date(d.date) >= from)
    return {
      datasets: (metric.value?.values ?? []).map((v, index) => ({
        label: v.label,
        // oldest first, without the measures missing this value
        data: inPeriod.filter(d => d[v.field] > 0).map(d => ({ x: new Date(d.date).getTime(), y: d[v.field] })).reverse(),
        borderColor: color(index),
        backgroundColor: color(index),
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        // a 2px ring of the surface keeps overlapping points apart
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        tension: 0.2,
      })),
    }
  })

  const options = computed((): ChartOptions<'line'> => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: 'nearest', axis: 'x', intersect: false },
    plugins: {
      // the title names a single series, two get a legend
      legend: {
        display: (metric.value?.values.length ?? 0) > 1,
        position: 'bottom',
        labels: { usePointStyle: true, pointStyle: 'circle' },
      },
      tooltip: {
        callbacks: {
          title: items => formatMeasureDate(new Date(items[0].parsed.x).toISOString()),
          label: item => `${item.dataset.label}: ${item.parsed.y.toLocaleString('fr-FR')} ${metric.value?.unit ?? ''}`,
        },
      },
    },
    scales: {
      x: {
        type: 'time',
        time: { unit: months.value === 3 ? 'week' : 'month', tooltipFormat: 'dd/MM/yyyy' },
        grid: { display: false },
        // horizontal labels, fewer of them on a phone rather than rotated
        ticks: { maxRotation: 0, autoSkip: true, autoSkipPadding: 16 },
      },
      y: {
        title: { display: true, text: metric.value?.unit ?? '' },
        grid: { color: 'rgba(0, 0, 0, 0.06)' },
        // the decimal comma of the rest of the page
        ticks: { callback: value => Number(value).toLocaleString('fr-FR') },
      },
    },
  }))

  const empty = computed(() => chartData.value.datasets.every(d => d.data.length === 0))
</script>

<template>
  <v-card>
    <v-card-item>
      <v-card-title>{{ metric?.title ?? 'Trend' }}</v-card-title>
    </v-card-item>
    <v-card-text>
      <!-- the filters in one row above the chart -->
      <div class="d-flex flex-wrap align-center ga-2 mb-4">
        <!-- column: the chips wrap on a phone instead of scrolling out of sight -->
        <v-chip-group v-model="selected" color="primary" column mandatory>
          <v-chip
            v-for="m in metrics"
            :key="m.key"
            filter
            size="small"
            :value="m.key"
          >{{ m.title }}</v-chip>
        </v-chip-group>
        <v-spacer />
        <v-btn-toggle v-model="months" density="compact" mandatory variant="outlined">
          <v-btn v-for="p in periods" :key="p.value" size="small" :value="p.value">{{ p.title }}</v-btn>
        </v-btn-toggle>
      </div>
      <div v-if="empty" class="text-center text-medium-emphasis pa-8">No measure in this period</div>
      <div v-else class="health-chart">
        <Line :data="chartData" :options="options" />
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.health-chart {
  height: 280px;
}
</style>
