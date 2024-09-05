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
    id: {
      type: String,
      required: true,
    },
  })
  console.log('Graph:', props.graph, props.id)
  const xaxis = ref<number[]>([])
  const yaxis = ref<number[]>([])
  let labels: string[] = []
  let data: number[] = []

  if (props.graph && props.id) {
    await activitiesStore.getActivity(props.id)
    const activity = activitiesStore.activity
    while (activity.value === undefined) {
      console.log('Activity not found')
    }
    switch (props.graph) {
      case 'speed':
        xaxis.value = activity?.value.dist_array
        yaxis.value = activity?.value.speeds
        labels = xaxis.value.map(x => (x / 1000).toFixed(1))
        data = yaxis.value.map(x => x * 3.6)
        break
    }
    console.log('Labels:', labels)
    console.log('Data:', data)
    chartData.value = {
      labels,
      datasets: [{
        label: props.graph,
        data,
      }],
    }
  }
</script>

<template>
  <suspense>
    <Line
      id="line-chart-id"
      :options="chartOptions"
      :data="chartData"
      v-if="xaxis && yaxis"
    />
  </suspense>
</template>

<style scoped lang="sass">

</style>
