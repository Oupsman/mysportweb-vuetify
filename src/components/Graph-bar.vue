<script setup lang="ts">
  import { ref, onBeforeMount } from 'vue'
  import type { Ref } from 'vue'

  import { Bar } from 'vue-chartjs'
  import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarController,
    BarElement,
    Title,
    Tooltip,
    Legend,
  } from 'chart.js'

  import { useActivitiesStore } from '@/stores/activities'

  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarController,
    BarElement,
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
  const xaxis = ref<number[]>([])
  const yaxis = ref<number[]>([])
  let labels: string[] = []
  let data: number[] = []
  let color = 'lightgreen'
  if (props.graph) {
    switch (props.graph) {
      case 'means':
        for (let i = 0; i < props.activity.means.length; i++) {
          labels[i] = (i + 1).toString()
        }
        yaxis.value = props.activity.means
        //    labels = xaxis.value.map(x => (x / 1000).toFixed(1))
        data = yaxis.value.map(x => x * 3.6)
        break
    }
    chartData.value = {
      labels,
      datasets: [{
        label: props.graph,
        data,
        backgroundColor: color,
        pointRadius: 0,
      }],
    }
  } else {
    console.log(props.graph)
  }
</script>

<template>
  <Bar
    v-if="xaxis && yaxis"
    id='bar-chart-id'
    class="graphbar"
    :data="chartData"
    :options="chartOptions"
  />
</template>

<style scoped lang="css">
.graphbar {
  height: 150px;
}
</style>
