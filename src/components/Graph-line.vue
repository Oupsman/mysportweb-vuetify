<script setup lang="ts">
  import { ref, onBeforeMount } from 'vue'
  import type { Ref } from 'vue'

  import { Line } from 'vue-chartjs'
  import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
  } from 'chart.js'

  import { useActivitiesStore } from '@/stores/activities'

  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
  )
  const activitiesStore = useActivitiesStore()

  const chartData: Ref<GraphData> = ref({ labels: [], datasets: [] })

  const chartOptions = {
    responsive: true,
  }
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
  console.log('Graph:', props.graph)
  const xaxis = ref<number[]>([])
  const yaxis = ref<number[]>([])
  let labels: string[] = []
  let data: number[] = []
  let color = 'green'
  if (props.graph) {
    switch (props.graph) {
      case 'speed':
        xaxis.value = props.activity.dist_array
        yaxis.value = props.activity.speeds
        labels = xaxis.value.map(x => (x / 1000).toFixed(1))
        data = yaxis.value.map(x => x * 3.6)
        break
      case 'hr':
        xaxis.value = props.activity.dist_array
        yaxis.value = props.activity.hearts
        labels = xaxis.value.map(x => (x / 1000).toFixed(1))
        data = yaxis.value
        color = 'red'
        break
      case 'cadence':
        xaxis.value = props.activity.dist_array
        yaxis.value = props.activity.cadences
        labels = xaxis.value.map(x => (x / 1000).toFixed(1))
        data = yaxis.value
        color = 'blue'
        break
    }
    console.log('Labels:', labels)
    console.log('Data:', data)
    chartData.value = {
      labels,
      datasets: [{
        label: props.graph,
        data,
        borderColor: color,
        pointRadius: 0,
      }],
    }
  } else {
    console.log(props.graph)
  }
</script>

<template>
  <suspense>
    <Line
      v-if="xaxis && yaxis"
      id="line-chart-id"
      :data="chartData"
      :options="chartOptions"
    />
  </suspense>
</template>

<style scoped lang="sass">

</style>
