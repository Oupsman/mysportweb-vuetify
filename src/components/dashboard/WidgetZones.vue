<script setup lang="ts">
  import { computed } from 'vue'
  import type { PropType } from 'vue'
  import WeeklyHrZonesChart from '@/components/WeeklyHrZonesChart.vue'
  import { useTrainingStore } from '@/stores/training'
  import { powerZones } from '@/utils/zones'

  // the time in heart rate or power zones of the last weeks
  const props = defineProps({
    kind: {
      type: String as PropType<'hr' | 'power'>,
      required: true,
    },
  })
  const trainingStore = useTrainingStore()
  const data = computed(() => props.kind === 'hr' ? trainingStore.hrZones : trainingStore.powerZones)
</script>

<template>
  <v-card v-if="data" class="widget-card">
    <v-card-item>
      <v-card-title>{{ kind === 'hr' ? 'Heart rate zones' : 'Power zones' }}</v-card-title>
      <v-card-subtitle v-if="kind === 'hr'">Last {{ data.weeks.length }} weeks, by heart rate reserve</v-card-subtitle>
      <v-card-subtitle v-else>Last {{ data.weeks.length }} weeks, rides with a power meter, by FTP</v-card-subtitle>
    </v-card-item>
    <v-card-text>
      <WeeklyHrZonesChart v-if="kind === 'hr'" :data="data" />
      <WeeklyHrZonesChart v-else :data="data" :zones="powerZones" />
    </v-card-text>
  </v-card>
</template>
