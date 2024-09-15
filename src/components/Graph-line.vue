<script setup lang="ts">
  import type { Ref } from 'vue'
  import { ref } from 'vue'
  import 'chartjs-adapter-date-fns'

  import { Line } from 'vue-chartjs'
  import {
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    TimeScale,
    Title,
    Tooltip,
    Filler,
  } from 'chart.js'

  import { useActivitiesStore } from '@/stores/activities'

  ChartJS.register(
    CategoryScale,
    LinearScale,
    TimeScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
  )
  const activitiesStore = useActivitiesStore()

  let chartOptions = {
    responsive: true,
  }

  const chartData: Ref<GraphData> = ref({ labels: [], datasets: [] })
  const type = ref('line')
  const stepped = ref(false)
  const display = ref(false)
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

  const xaxis = ref<number[]>([])
  const yaxis = ref<number[]>([])
  let labels: string[] = []
  let data: number[] = []
  let color = 'green'
  if (props.graph) {
    switch (props.graph) {
      case 'speed':
        const date = new Date(props.activity.date)
        xaxis.value = []
        yaxis.value = props.activity.speeds
        data = yaxis.value.map((y, i) => {
          const timestamp = date.getTime() + props.activity.time_stamps[i] * 1000
          return { x: timestamp, y: y * 3.6       }
        })
        chartOptions = {
          responsive: true,
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'second',
                displayFormats: {
                  second: 'HH:mm:ss',
                },
              },
            },
          },
        }
        display.value = true
        color = 'green'
        break
      case 'hr':
        if (props.activity.hearts !== null) {
          const date = new Date(props.activity.date)
          xaxis.value = []
          yaxis.value = props.activity.hearts
          data = yaxis.value.map((y, i) => {
            const timestamp = date.getTime() + props.activity.time_stamps[i] * 1000
            return { x: timestamp, y }
          })
          color = 'red'
          chartOptions = {
            responsive: true,
            scales: {
              x: {
                type: 'time',
                time: {
                  unit: 'second',
                  displayFormats: {
                    second: 'HH:mm:ss',
                  },
                },
              },
            },
          }
          color = 'red'
          display.value = true
        }

        break
      case 'cadence':
        if (props.activity.cadences !== null) {
          const date = new Date(props.activity.date)
          xaxis.value = []
          yaxis.value = props.activity.cadences
          data = yaxis.value.map((y, i) => {
            const timestamp = date.getTime() + props.activity.time_stamps[i] * 1000
            return { x: timestamp, y }
          })
          chartOptions = {
            responsive: true,
            scales: {
              x: {
                type: 'time',
                time: {
                  unit: 'second',
                  displayFormats: {
                    second: 'HH:mm:ss',
                  },
                },
              },
            },
          }
          display.value = true
          color = 'blue'
        }
        break
      case 'altitude':
        if (props.activity.altitudes !== null ) {
          const date = new Date(props.activity.date)
          xaxis.value = []
          yaxis.value = props.activity.altitudes
          data = yaxis.value.map((y, i) => {
            const timestamp = date.getTime() + props.activity.time_stamps[i] * 1000
            return { x: timestamp, y }
          })
          chartOptions = {
            responsive: true,
            scales: {
              x: {
                type: 'time',
                time: {
                  unit: 'second',
                  displayFormats: {
                    second: 'HH:mm:ss',
                  },
                },
              },
            },
          }
          display.value = true
          color = 'lightblue'
        }
        break
      case 'swolf':
        for (let i = 0; i < props.activity.lengths.length; i++) {
          const date = new Date(props.activity.date)
          const timestamp = date.getTime() + props.activity.lengths[i].timeStamp * 1000
          xaxis.value.push(timestamp)
          yaxis.value.push(props.activity.lengths[i].swolf)
        }

        stepped.value = 'before'
        labels = xaxis.value
        data = yaxis.value
        color = 'blue'
        chartOptions = {
          responsive: true,
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'second',
                displayFormats: {
                  second: 'HH:mm:ss',
                },
              },
            },
          },
        }
        display.value = true
        break
      case 'pace':
        for (let i = 0; i < props.activity.lengths.length; i++) {
          const date = new Date(props.activity.date)
          const timestamp = date.getTime() + props.activity.lengths[i].timeStamp * 1000
          xaxis.value.push(timestamp)
          yaxis.value.push(props.activity.lengths[i].pace)
        }
        chartOptions = {
          responsive: true,
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'second',
                displayFormats: {
                  second: 'HH:mm:ss',
                },
              },
            },
          },
        }
        stepped.value = 'before'
        labels = xaxis.value
        data = yaxis.value
        color = 'lightgreen'
        display.value = true

        break
      case 'strokes':
        for (let i = 0; i < props.activity.lengths.length; i++) {
          const date = new Date(props.activity.date)
          const timestamp = date.getTime() + props.activity.lengths[i].timeStamp * 1000
          xaxis.value.push(timestamp)
          if (props.activity.lengths[i].strokes !== 65535) {
            yaxis.value.push(props.activity.lengths[i].strokes)
          } else {
            yaxis.value.push(0)
          }
        }
        chartOptions = {
          responsive: true,
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'second',
                displayFormats: {
                  second: 'HH:mm:ss',
                },
              },
            },
          },
        }
        stepped.value = 'before'
        labels = xaxis.value
        data = yaxis.value
        color = 'orange'
        display.value = true

        break
    }
    chartData.value = {
      labels,
      datasets: [{
        stepped: stepped.value,
        label: props.graph,
        data,
        borderColor: color,
        backgroundColor: color,
        pointRadius: 0,
        fill: true,
      }],
    }
  } else {
    console.log(props.graph)
  }
</script>

<template>
  <Line
    v-if="display"
    id="line-chart-id"
    class="graphline"
    :data="chartData"
    :options="chartOptions"
  />
</template>

<style scoped lang="css">
  .graphline {
    height: 50px;
  }
</style>
