<script setup lang="ts">
  import { computed, ref } from 'vue'
  import type { PropType } from 'vue'
  import { useTrainingStore } from '@/stores/training'
  import { mdiBatteryHeartVariant, mdiHeartPulse, mdiTrendingUp } from '@mdi/js'
  import ReadinessChart from '@/components/ReadinessChart.vue'
  import type { Readiness, ReadinessStatus } from '@/types/training'

  const props = defineProps({
    readiness: {
      type: Object as PropType<Readiness>,
      required: true,
    },
  })
  const today = computed(() => props.readiness.today)

  // the period of the chart: the store loads the series again; today's state doesn't depend on it
  const trainingStore = useTrainingStore()
  const periods = [
    { days: 30, label: '1 month' },
    { days: 90, label: '3 months' },
    { days: 180, label: '6 months' },
    { days: 365, label: '1 year' },
  ]
  const days = ref(props.readiness.series.length || 90)
  const loading = ref(false)
  const choosePeriod = async (n: number) => {
    loading.value = true
    try {
      await trainingStore.getReadiness(n)
    } catch {
      // the chart keeps the previous period
    } finally {
      loading.value = false
    }
  }

  const statuses: Record<ReadinessStatus, { label: string, color: string, advice: string }> = {
    not_enough_data: {
      label: 'Not enough data',
      color: 'grey',
      advice: 'The trend needs at least 4 weeks of activities with heart rate or a training score.',
    },
    fresh: { label: 'Fresh', color: 'info', advice: 'Rested: a good day for a hard session or a race.' },
    neutral: { label: 'Neutral', color: 'grey-darken-1', advice: 'Training and recovery are balanced.' },
    productive: { label: 'Productive', color: 'success', advice: 'The load builds your fitness: keep the easy days easy.' },
    overreaching: { label: 'Overreaching', color: 'error', advice: 'The fatigue is high: plan rest or easy days.' },
  }
  const status = computed(() => statuses[today.value.status])
  const enoughData = computed(() => today.value.status !== 'not_enough_data')

  const signed = (x: number) => `${x > 0 ? '+' : ''}${Math.round(x)}`
  const bpm = (x: number) => `${x.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} bpm`
</script>

<template>
  <v-card class="widget-card">
    <v-card-item>
      <template #prepend>
        <v-icon color="primary" :icon="mdiBatteryHeartVariant" />
      </template>
      <v-card-title>Readiness</v-card-title>
      <v-card-subtitle>Fitness and fatigue from your training loads</v-card-subtitle>
      <template #append>
        <v-chip :color="status.color" size="small" variant="flat">{{ status.label }}</v-chip>
      </template>
    </v-card-item>
    <v-card-text>
      <div class="text-body-2 mb-3">{{ status.advice }}</div>

      <v-alert
        v-if="today.flags.includes('load_spike')"
        class="mb-2"
        density="compact"
        :icon="mdiTrendingUp"
        type="warning"
        variant="tonal"
      >
        Your load of the last 7 days is {{ today.acwr?.toLocaleString('fr-FR') }} times your usual one: increasing
        it this fast raises the risk of injury.
      </v-alert>
      <v-alert
        v-if="today.flags.includes('elevated_rest_hr') && today.rest_hr_delta !== null"
        class="mb-2"
        density="compact"
        :icon="mdiHeartPulse"
        type="warning"
        variant="tonal"
      >
        Your resting heart rate is {{ bpm(today.rest_hr_delta) }} above your usual one: a sign of fatigue,
        stress or illness coming.
      </v-alert>

      <div v-if="enoughData" class="figures mb-3">
        <div>
          <div class="text-caption text-medium-emphasis">Fitness</div>
          <div class="text-h5 font-weight-medium">{{ Math.round(today.fitness) }}</div>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis">Fatigue</div>
          <div class="text-h5 font-weight-medium">{{ Math.round(today.fatigue) }}</div>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis">Form</div>
          <div class="text-h5 font-weight-medium">{{ signed(today.form) }}</div>
        </div>
      </div>

      <div v-if="today.rest_hr_7d !== null" class="d-flex justify-space-between text-body-2 mb-3">
        <span>Resting heart rate, 7 days</span>
        <span>
          <strong>{{ bpm(today.rest_hr_7d) }}</strong>
          <span v-if="today.rest_hr_30d !== null" class="text-medium-emphasis"> / usual {{ bpm(today.rest_hr_30d) }}</span>
        </span>
      </div>

      <template v-if="enoughData">
        <div class="d-flex justify-end mb-1">
          <v-btn-toggle
            v-model="days"
            density="compact"
            divided
            mandatory
            variant="outlined"
            @update:model-value="choosePeriod"
          >
            <v-btn v-for="period in periods" :key="period.days" size="small" :value="period.days">{{ period.label }}</v-btn>
          </v-btn-toggle>
        </div>
        <v-progress-linear :active="loading" indeterminate />
        <ReadinessChart :series="readiness.series" />
      </template>
      <div class="text-caption text-medium-emphasis mt-2">
        Fitness: average daily load of 6 weeks, fatigue: of 1 week, form: their difference. The load of an
        activity is the training score of the device, else computed from the heart rate.
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.figures {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
</style>
