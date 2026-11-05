<script setup lang="ts">
  import { ref } from 'vue'

  import { Bar } from 'vue-chartjs'
  import {
    BarController,
    BarElement,
    CategoryScale,
    ChartData,
    ChartDataset,
    Chart as ChartJS,
    Legend,
    LinearScale, Title, Tooltip,
  } from 'chart.js'

  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarController,
    BarElement,
    Title,
    Tooltip,
    Legend
  )

  const chartOptions = {
    responsive: true,
    // the height comes from the wrapper, see Graph-line
    maintainAspectRatio: false,
    scales: { },
  }
  let chartData: ChartData<'bar'> = {
    labels: [], // Vos labels ici
    datasets: [
      {
        type: 'bar',
        label: 'Votre label',
        data: [],
      },
    ] as ChartDataset<'bar', (number | [number, number])[]>[],
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
  const labels: string[] = []
  let data: number[] = []
  const color = 'lightgreen'
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
    chartData = {
      labels,
      datasets: [{
        label: props.graph,
        data,
        backgroundColor: color,
      }],
    }
  } else {
    console.log(props.graph)
  }
</script>

<template>
  <div v-if="xaxis && yaxis" class="graphbar">
    <Bar
      id="bar-chart-id"
      :data="chartData"
      :options="chartOptions"
    />
  </div>
</template>

<style scoped lang="css">
.graphbar {
  position: relative;
  height: 220px;
}
</style>
