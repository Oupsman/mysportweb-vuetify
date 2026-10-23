<script setup lang="ts">
  import 'chartjs-adapter-date-fns'
  import { computed, ref, watch } from 'vue'
  import { Line } from 'vue-chartjs'
  import { Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, TimeScale, Tooltip } from 'chart.js'
  import type { ChartData, ChartDataset, ChartOptions } from 'chart.js'
  import type { HealthData } from '@/types/health'
  import { formatMeasureDate, measuredMetrics } from '@/utils/health'

  ChartJS.register(LinearScale, TimeScale, PointElement, LineElement, Tooltip, Legend)

  // target: the target weight, a reference line on the weight chart; 0 without
  const props = defineProps<{ datas: HealthData[], target?: number }>()

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
    const series: ChartDataset<'line', { x: number, y: number }[]>[] = (metric.value?.values ?? []).map((v, index) => ({
      label: v.label,
      // oldest first, without the measures missing this value
      data: inPeriod.filter(d => d[v.field] > 0).map(d => ({ x: new Date(d.date).getTime(), y: d[v.field] })).reverse(),
      borderColor: color(index),
      backgroundColor: color(index),
      borderWidth: 2,
      // a dense series (a year of weekly weights) is a line: its dots would cut it into dashes,
      // the hover still shows each measure
      pointRadius: inPeriod.filter(d => d[v.field] > 0).length > 40 ? 0 : 4,
      pointHoverRadius: 6,
      // a 2px ring of the surface keeps overlapping points apart
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      tension: 0.2,
    }))
    // the target: a recessive dashed line across the measures shown, gray ink, not a series color
    const times = series.flatMap(s => s.data.map(p => p.x))
    if (metric.value?.key === 'weight' && props.target && times.length > 0) {
      series.push({
        label: 'Target',
        data: [{ x: Math.min(...times), y: props.target }, { x: Math.max(...times), y: props.target }],
        borderColor: '#52514e',
        backgroundColor: '#52514e',
        borderWidth: 1.5,
        borderDash: [6, 4],
        pointRadius: 0,
        pointHoverRadius: 0,
        pointBorderColor: '#52514e',
        pointBorderWidth: 0,
        tension: 0,
      })
    }
    return { datasets: series }
  })

  const options = computed((): ChartOptions<'line'> => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: 'nearest', axis: 'x', intersect: false },
    plugins: {
      // the title names a single series, two get a legend
      // two series, or a series and the target line
      legend: {
        display: chartData.value.datasets.length > 1,
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
