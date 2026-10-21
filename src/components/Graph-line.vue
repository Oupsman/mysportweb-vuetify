<script setup lang="ts">
  import { inject, markRaw, ref, watch } from 'vue'
  import 'chartjs-adapter-date-fns'
  import { Line } from 'vue-chartjs'
  import {
    Chart as ChartJS,
    Decimation,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    TimeScale,
    Title,
    Tooltip,
  } from 'chart.js'
  import type { ChartData, ChartOptions, Plugin } from 'chart.js'
  import { activityCursorKey, nearestIndex } from '@/composables/activityCursor'

  ChartJS.register(LinearScale, TimeScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, Decimation)

  const props = defineProps({
    graph: {
      type: String,
      required: true,
    },
    activity: {
      type: Object,
      required: true,
    },
  })

  type DataPoint = { x: number, y: number }
  type Serie = { values: number[], stamps: number[], color: string, stepped?: 'before' }

  const activity = props.activity
  const numbers = (values?: (number | string)[] | null): number[] => (values ?? []).map(Number)
  // own time stamps of a sparse serie, the records ones for activities imported before they existed
  const stampsOf = (own?: number[] | null): number[] => own?.length ? own : numbers(activity.time_stamps)
  const lengths = (activity.lengths ?? []) as { swolf: number, pace: number, strokes: number, timeStamp: number }[]
  const lengthStamps = lengths.map(l => l.timeStamp)

  // values and their time stamps, in seconds since the start of the activity
  const series: Record<string, () => Serie> = {
    speed: () => ({ values: numbers(activity.speeds).map(v => v * 3.6), stamps: numbers(activity.time_stamps), color: 'green' }),
    hr: () => ({ values: numbers(activity.hearts), stamps: stampsOf(activity.heart_time_stamps), color: 'red' }),
    cadence: () => ({ values: numbers(activity.cadences), stamps: stampsOf(activity.cadence_time_stamps), color: 'blue' }),
    altitude: () => ({ values: numbers(activity.altitudes), stamps: numbers(activity.time_stamps), color: 'lightblue' }),
    power: () => ({ values: numbers(activity.powers), stamps: numbers(activity.power_ts), color: 'darksalmon' }),
    swolf: () => ({ values: lengths.map(l => l.swolf), stamps: lengthStamps, color: 'blue', stepped: 'before' }),
    pace: () => ({ values: lengths.map(l => l.pace), stamps: lengthStamps, color: 'lightgreen', stepped: 'before' }),
    strokes: () => ({ values: lengths.map(l => l.strokes === 65535 ? 0 : l.strokes), stamps: lengthStamps, color: 'orange', stepped: 'before' }),
  }

  const serie = series[props.graph]?.()
  const start = new Date(activity.date).getTime()
  const points: DataPoint[] = []
  if (serie) {
    const count = Math.min(serie.values.length, serie.stamps.length)
    for (let i = 0; i < count; i++) {
      points.push({ x: start + serie.stamps[i] * 1000, y: serie.values[i] })
    }
  }
  const display = points.length > 0

  // the chart data is big and never changes: keep Vue from making it reactive
  const chartData: ChartData<'line', DataPoint[]> = markRaw({
    datasets: [{
      label: props.graph,
      data: points,
      stepped: serie?.stepped ?? false,
      borderColor: serie?.color,
      backgroundColor: serie?.color,
      borderWidth: 1,
      fill: true,
    }],
  })

  const cursor = inject(activityCursorKey, ref(null))
  // the vue-chartjs component exposes the Chart.js instance
  const chartRef = ref<{ chart?: ChartJS<'line', DataPoint[]> } | null>(null)

  // hovering a chart moves the cursor shared with the other charts and the map, at most once per frame
  let pending: number | null | undefined
  const setCursor = (time: number | null) => {
    if (pending === undefined) {
      requestAnimationFrame(() => {
        cursor.value = pending ?? null
        pending = undefined
      })
    }
    pending = time
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    // performance: no animation, data already parsed and sorted, no point drawn, decimated to the chart width
    animation: false,
    parsing: false,
    normalized: true,
    elements: { point: { radius: 0, hoverRadius: 4 } },
    interaction: { mode: 'nearest', axis: 'x', intersect: false },
    plugins: {
      decimation: { enabled: true, algorithm: 'lttb', samples: 500 },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          tooltipFormat: 'HH:mm:ss',
          displayFormats: { second: 'HH:mm:ss', minute: 'HH:mm', hour: 'HH:mm' },
        },
      },
    },
  }

  // moves the shared cursor with the mouse, and draws it as a vertical line
  const cursorLine: Plugin<'line'> = {
    id: 'cursorLine',
    // afterEvent sees every event (onHover only those inside the chart area, so never the mouse leaving).
    // Replays come from chart.update() when following the cursor: ignoring them avoids a feedback loop
    afterEvent (chart, args) {
      const event = args.event
      if (args.replay) {
        return
      }
      if (event.type === 'mouseout' || !args.inChartArea || event.x === null) {
        setCursor(null)
      } else if (event.type === 'mousemove') {
        setCursor(chart.scales.x.getValueForPixel(event.x) ?? null)
      }
    },
    afterDatasetsDraw (chart) {
      if (cursor.value === null) {
        return
      }
      const x = chart.scales.x.getPixelForValue(cursor.value)
      const { top, bottom, left, right } = chart.chartArea
      if (x < left || x > right) {
        return
      }
      const ctx = chart.ctx
      ctx.save()
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, top)
      ctx.lineTo(x, bottom)
      ctx.stroke()
      ctx.restore()
    },
  }

  // follow the cursor: tooltip on the closest point of this serie
  watch(cursor, time => {
    const chart = chartRef.value?.chart
    if (!chart) {
      return
    }
    // with decimation, the dataset holds the decimated points
    const data = chart.data.datasets[0].data
    const index = time === null ? -1 : nearestIndex(data, time, p => p.x)
    // no tooltip when this serie has no value around the cursor (power and swimming series are sparser)
    if (index < 0 || Math.abs(data[index].x - (time as number)) > 60000) {
      chart.setActiveElements([])
      chart.tooltip?.setActiveElements([], { x: 0, y: 0 })
    } else {
      const active = [{ datasetIndex: 0, index }]
      chart.setActiveElements(active)
      chart.tooltip?.setActiveElements(active, { x: chart.scales.x.getPixelForValue(data[index].x), y: 0 })
    }
    chart.update('none')
  })
</script>

<template>
  <Line
    v-if="display"
    ref="chartRef"
    class="graphline"
    :data="chartData"
    :options="options"
    :plugins="[cursorLine]"
  />
</template>

<style scoped lang="css">
  .graphline {
    height: 50px;
  }
</style>
