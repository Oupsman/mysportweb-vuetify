<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue'
  import PowerCurveChart from '@/components/PowerCurveChart.vue'
  import type { CurveSeries } from '@/components/PowerCurveChart.vue'
  import { useAppStore } from '@/stores/app'
  import { useTrainingStore } from '@/stores/training'
  import type { PowerCurve } from '@/types/records'
  import { isoDay } from '@/utils/efforts'

  const trainingStore = useTrainingStore()
  const appStore = useAppStore()

  // the periods, as [from, to] (YYYY-MM-DD, '' for no bound)
  const periods = [
    { title: 'Last 90 days', value: 'last90' },
    { title: 'This year', value: 'year' },
    { title: 'Last year', value: 'lastyear' },
    { title: 'All time', value: 'all' },
    { title: 'Custom', value: 'custom' },
  ]
  const compared = [{ title: 'No comparison', value: 'none' }, ...periods.filter(p => p.value !== 'custom')]
  const bounds = (value: string): [string, string] => {
    const now = new Date()
    switch (value) {
      case 'last90': return [isoDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 89)), '']
      case 'year': return [`${now.getFullYear()}-01-01`, '']
      case 'lastyear': return [`${now.getFullYear() - 1}-01-01`, `${now.getFullYear() - 1}-12-31`]
      case 'custom': return [customFrom.value, customTo.value]
    }
    return ['', '']
  }

  const period = ref('last90')
  const comparison = ref('lastyear')
  const customFrom = ref(isoDay(new Date(new Date().getFullYear(), 0, 1)))
  const customTo = ref(isoDay(new Date()))
  const perKg = ref(false)

  const main = ref<PowerCurve | null>(null)
  const other = ref<PowerCurve | null>(null)
  const isLoading = ref(true)
  const error = ref('')
  const load = async () => {
    isLoading.value = true
    error.value = ''
    try {
      const [from, to] = bounds(period.value)
      const [otherFrom, otherTo] = bounds(comparison.value)
      ;[main.value, other.value] = await Promise.all([
        trainingStore.getPowerCurve(from, to),
        comparison.value === 'none' ? Promise.resolve(null) : trainingStore.getPowerCurve(otherFrom, otherTo),
      ])
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      isLoading.value = false
    }
  }
  onMounted(load)
  watch([period, comparison, customFrom, customTo], load)

  const label = (value: string) => periods.find(p => p.value === value)?.title ?? value
  const series = computed((): CurveSeries[] => {
    const list: CurveSeries[] = []
    if (main.value?.points.length) {
      list.push({ label: label(period.value), color: '#2a78d6', points: main.value.points })
    }
    if (other.value?.points.length) {
      list.push({ label: label(comparison.value), color: '#f2790c', dashed: true, points: other.value.points })
    }
    return list
  })
  // the weight of the latest ride of the period, for the FTP and CP lines in W/kg
  const weight = computed(() => {
    const latest = [...(main.value?.points ?? [])].filter(p => p.watts_per_kg)
      .sort((a, b) => b.date.localeCompare(a.date))[0]
    return latest?.watts_per_kg ? latest.watts / latest.watts_per_kg : undefined
  })
  const cp = computed(() => main.value?.critical_power ?? null)
</script>

<template>
  <v-card>
    <v-card-item>
      <v-card-title>Power curve</v-card-title>
      <v-card-subtitle>Your best power over each duration, rides with a power meter. Click a point to open its ride.</v-card-subtitle>
    </v-card-item>
    <v-card-text>
      <v-row dense>
        <v-col cols="12" sm="4">
          <v-select v-model="period" density="compact" :items="periods" label="Period" />
        </v-col>
        <v-col cols="12" sm="4">
          <v-select v-model="comparison" density="compact" :items="compared" label="Compared with" />
        </v-col>
        <v-col class="d-flex align-center" cols="12" sm="4">
          <v-btn-toggle v-model="perKg" density="compact" mandatory variant="outlined">
            <v-btn :value="false">W</v-btn>
            <v-btn :value="true">W/kg</v-btn>
          </v-btn-toggle>
        </v-col>
      </v-row>
      <v-row v-if="period === 'custom'" dense>
        <v-col cols="6" sm="4">
          <v-text-field v-model="customFrom" density="compact" label="From" type="date" />
        </v-col>
        <v-col cols="6" sm="4">
          <v-text-field v-model="customTo" density="compact" label="To" type="date" />
        </v-col>
      </v-row>
      <v-alert v-if="error" class="mb-2" type="error">{{ error }}</v-alert>
      <v-progress-linear v-if="isLoading" indeterminate />
      <div v-else-if="series.length === 0" class="text-medium-emphasis py-6 text-center">
        No ride with a power meter in this period.
      </div>
      <template v-else>
        <PowerCurveChart
          :cp="cp?.cp"
          :ftp="main?.ftp || undefined"
          :per-kg="perKg"
          :series="series"
          :weight="weight"
          @open="id => appStore.navigateToPage(`/activity/${id}`)"
        />
        <div class="d-flex flex-wrap ga-2 mt-3">
          <v-chip v-if="main?.ftp" size="small" title="The current one: yours, or estimated from your rides">
            FTP {{ main.ftp }} W
          </v-chip>
          <v-chip
            v-if="cp"
            size="small"
            :title="`Fitted on your best 3 to 20 minutes of the period (R² ${cp.r2}): far from your FTP, one of them wasn't all-out`"
          >
            Critical power {{ cp.cp }} W · W′ {{ (cp.w_prime / 1000).toFixed(1) }} kJ
          </v-chip>
        </div>
      </template>
    </v-card-text>
  </v-card>
</template>
