<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import PowerCurveChart from '@/components/PowerCurveChart.vue'
  import type { CurveSeries } from '@/components/PowerCurveChart.vue'
  import { useAppStore } from '@/stores/app'
  import { useTrainingStore } from '@/stores/training'
  import type { PowerCurve, PowerCurvePoint } from '@/types/records'
  import { isoDay } from '@/utils/efforts'

  // the curve of an activity with measured power; its owner also sees their best of the 90 days before it, in
  // its sport
  const props = defineProps<{ curve: PowerCurvePoint[], date: string, sport: string, owner: boolean }>()

  const trainingStore = useTrainingStore()
  const appStore = useAppStore()
  const before = ref<PowerCurve | null>(null)
  onMounted(async () => {
    if (!props.owner) return
    const day = new Date(props.date)
    const from = isoDay(new Date(day.getFullYear(), day.getMonth(), day.getDate() - 90))
    const to = isoDay(new Date(day.getFullYear(), day.getMonth(), day.getDate() - 1))
    before.value = await trainingStore.getPowerCurve(props.sport, from, to).catch((): null => null)
  })

  const series = computed((): CurveSeries[] => {
    const list: CurveSeries[] = [{ label: 'This activity', color: '#2a78d6', points: props.curve }]
    if (before.value?.points.length) {
      list.push({ label: 'Best of the 90 days before', color: '#9e9e9e', dashed: true, points: before.value.points })
    }
    return list
  })
</script>

<template>
  <v-card>
    <v-card-item>
      <v-card-title>Power curve</v-card-title>
      <v-card-subtitle>The best measured power of this activity over each duration</v-card-subtitle>
    </v-card-item>
    <v-card-text>
      <PowerCurveChart :series="series" @open="id => appStore.navigateToPage(`/activity/${id}`)" />
    </v-card-text>
  </v-card>
</template>
