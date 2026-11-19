<script setup lang="ts">
  import { computed } from 'vue'
  import type { PropType } from 'vue'
  import 'chartjs-adapter-date-fns'
  import { Line } from 'vue-chartjs'
  import {
    Chart as ChartJS,
    LinearScale,
    LineElement,
    PointElement,
    TimeScale,
    Tooltip,
  } from 'chart.js'
  import type { ChartData, ChartOptions, TooltipItem } from 'chart.js'
  import { useAppStore } from '@/stores/app'
  import type { SimilarActivity } from '@/types/activities'
  import { formatPace, formatSpeedFor, paceOf, usesPace } from '@/utils/format'

  ChartJS.register(LinearScale, TimeScale, PointElement, LineElement, Tooltip)

  const props = defineProps({
    // the activities of the route, the current one included
    activities: {
      type: Array as PropType<SimilarActivity[]>,
      required: true,
    },
    current: {
      type: String,
      required: true,
    },
    // the sport of the route: running and walking show the pace
    sport: {
      type: String,
      default: '',
    },
  })

  const pace = computed(() => usesPace(props.sport))

  const appStore = useAppStore()

  const fastest = '#f2c200' // a darker yellow than "yellow", which vanishes on white
  const slowest = '#e53935'
  const other = '#90a4ae'

  type DataPoint = { x: number, y: number | null }

  // oldest first, the line goes forward in time
  const sorted = computed(() => [...props.activities]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))

  // distances may differ by up to 10%, average speed compares them fairly
  const extremes = computed(() => {
    const speeds = sorted.value.map(a => a.avg_speed)
    return { max: Math.max(...speeds), min: Math.min(...speeds) }
  })

  // the fastest wins a tie with the slowest (every activity at the same speed)
  const colorOf = (activity: SimilarActivity) => {
    if (activity.avg_speed === extremes.value.max) return fastest
    if (activity.avg_speed === extremes.value.min) return slowest
    return other
  }

  const chartData = computed((): ChartData<'line', DataPoint[]> => {
    const activities = sorted.value
    const isCurrent = activities.map(a => a.id === props.current)
    return {
      datasets: [{
        label: pace.value ? 'Average pace' : 'Average speed',
        data: activities.map(a => ({
          x: new Date(a.date).getTime(),
          y: pace.value ? paceOf(a.avg_speed) : a.avg_speed * 3.6,
        })),
        borderColor: other,
        borderWidth: 1,
        pointBackgroundColor: activities.map(colorOf),
        // the activity of the page stands out with a bigger, outlined dot
        pointBorderColor: isCurrent.map(c => c ? '#000' : 'transparent'),
        pointBorderWidth: isCurrent.map(c => c ? 2 : 0),
        pointRadius: isCurrent.map(c => c ? 7 : 5),
        pointHoverRadius: isCurrent.map(c => c ? 9 : 7),
      }],
    }
  })

  const formatDate = (time: number) => new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date(time))

  const options = computed((): ChartOptions<'line'> => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: 'nearest', intersect: true },
    scales: {
      x: {
        type: 'time',
        time: { tooltipFormat: 'dd/MM/yyyy', displayFormats: { day: 'dd/MM', week: 'dd/MM', month: 'MM/yyyy' } },
      },
      // the faster at the top: a pace is lower when faster
      y: pace.value
        ? { reverse: true, title: { display: true, text: 'min/km' }, ticks: { callback: value => formatPace(Number(value)) } }
        : { title: { display: true, text: 'km/h' } },
    },
    plugins: {
      tooltip: {
        callbacks: {
          title: (items: TooltipItem<'line'>[]) => {
            const activity = sorted.value[items[0].dataIndex]
            return activity.id === props.current ? 'This activity' : activity.title
          },
          label: (item: TooltipItem<'line'>) =>
            `${formatDate((item.raw as DataPoint).x)}: ${formatSpeedFor(props.sport, sorted.value[item.dataIndex].avg_speed)}`,
        },
      },
    },
    // a click on a dot opens its activity
    onClick: (_event, elements) => {
      const activity = elements.length ? sorted.value[elements[0].index] : null
      if (activity && activity.id !== props.current) {
        appStore.navigateToPage(`/activity/${activity.id}`)
      }
    },
    onHover: (event, elements) => {
      const target = event.native?.target as HTMLElement | undefined
      if (target) {
        target.style.cursor = elements.length ? 'pointer' : 'default'
      }
    },
  }))
</script>

<template>
  <v-card>
    <v-card-title>Average {{ pace ? 'pace' : 'speed' }} on this route</v-card-title>
    <v-card-text>
      <div class="route-progress">
        <Line :data="chartData" :options="options" />
      </div>
      <div class="legend text-caption text-medium-emphasis">
        <span><span class="dot" :style="{ background: fastest }" />Fastest</span>
        <span><span class="dot" :style="{ background: slowest }" />Slowest</span>
        <span><span class="dot current" />This activity</span>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="css">
  /* Chart.js sizes the canvas from its parent, which must be positioned */
  .route-progress {
    position: relative;
    height: 220px;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-top: 8px;
  }

  .dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-right: 4px;
    vertical-align: middle;
  }

  .dot.current {
    border: 2px solid #000;
    background: #90a4ae;
  }
</style>
