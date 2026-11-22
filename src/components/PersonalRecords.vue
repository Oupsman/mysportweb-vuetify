<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue'
  import PowerCurveSection from '@/components/PowerCurveSection.vue'
  import { useTrainingStore } from '@/stores/training'
  import type { EffortRecord } from '@/types/records'
  import { effortSpeed, effortTarget, effortValue, rankColor } from '@/utils/efforts'
  import { formatDate, sportIcon, sportLabel } from '@/utils/format'

  const trainingStore = useTrainingStore()

  // the period of the records: all time, or since a day
  const periods = [
    { title: 'All time', value: 'all' },
    { title: 'Last 12 months', value: 'year' },
    { title: 'This year', value: 'season' },
  ]
  const period = ref('all')
  const since = (value: string): string => {
    const now = new Date()
    const day = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (value === 'year') {
      return day(new Date(now.getFullYear() - 1, now.getMonth(), now.getDate() + 1))
    }
    return value === 'season' ? `${now.getFullYear()}-01-01` : ''
  }

  const records = ref<EffortRecord[]>([])
  const isLoading = ref(true)
  const error = ref('')
  const load = async () => {
    isLoading.value = true
    error.value = ''
    try {
      records.value = (await trainingStore.getRecords('', since(period.value), 3)).records
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      isLoading.value = false
    }
  }
  onMounted(load)
  watch(period, load)

  // the sports with records, running first, then by name
  const sports = computed(() => [...new Set(records.value.map(r => r.sport))]
    .sort((a, b) => a === 'running' ? -1 : b === 'running' ? 1 : a.localeCompare(b)))
  const sport = ref('')
  watch(sports, list => {
    if (!list.includes(sport.value)) {
      sport.value = list[0] ?? ''
    }
  })

  // the curve of the sport, when it has power records: measured power only
  const hasPower = computed(() => records.value.some(r => r.sport === sport.value && r.kind === 'power'))

  // the targets of the sport, by kind then target, each with its top efforts in rank order
  const sections = computed(() => ['distance', 'power'].map(kind => {
    const targets = new Map<number, EffortRecord[]>()
    for (const r of records.value) {
      if (r.sport === sport.value && r.kind === kind) {
        targets.set(r.target, [...(targets.get(r.target) ?? []), r])
      }
    }
    return {
      kind,
      title: kind === 'distance' ? 'Fastest' : 'Best power',
      targets: [...targets.entries()].sort(([a], [b]) => a - b).map(([target, top]) => ({ target, top })),
    }
  }).filter(s => s.targets.length > 0))
</script>

<template>
  <div>
    <div class="d-flex flex-wrap align-center ga-4 mb-4">
      <v-chip-group v-model="sport" color="primary" mandatory>
        <v-chip
          v-for="s in sports"
          :key="s"
          filter
          :prepend-icon="sportIcon(s)"
          :value="s"
        >
          {{ sportLabel(s) }}
        </v-chip>
      </v-chip-group>
      <v-spacer />
      <v-select
        v-model="period"
        density="compact"
        hide-details
        :items="periods"
        label="Period"
        style="max-width: 200px"
        variant="outlined"
      />
    </div>
    <v-alert v-if="error" class="mb-4" type="error">{{ error }}</v-alert>
    <v-progress-linear v-if="isLoading" class="mb-4" indeterminate />
    <v-alert v-else-if="!error && sports.length === 0" type="info" variant="tonal">
      No best effort for this period: runs of 400 m or more, rides of 10 km or more, or activities recorded with
      a power meter.
    </v-alert>
    <template v-for="section in sections" :key="section.kind">
      <h3 class="text-h6 mb-2">{{ section.title }}</h3>
      <div class="targets mb-6">
        <v-card v-for="t in section.targets" :key="t.target" density="compact">
          <v-card-item>
            <v-card-title class="text-subtitle-1 font-weight-bold">{{ effortTarget(section.kind, t.target) }}</v-card-title>
          </v-card-item>
          <v-card-text class="pt-0">
            <router-link
              v-for="r in t.top"
              :key="r.rank"
              class="effort"
              :class="{ first: r.rank === 1 }"
              :to="`/activity/${r.activity_id}`"
            >
              <span class="medal" :style="{ backgroundColor: rankColor(r.rank) }">{{ r.rank }}</span>
              <span class="value text-no-wrap">{{ effortValue(r) }}</span>
              <span class="text-medium-emphasis text-no-wrap">{{ effortSpeed(r) }}</span>
              <span class="title text-truncate" :title="r.activity_title">{{ r.activity_title }}</span>
              <span class="text-medium-emphasis text-no-wrap">{{ formatDate(r.date) }}</span>
            </router-link>
          </v-card-text>
        </v-card>
      </div>
    </template>
    <PowerCurveSection v-if="hasPower" :sport="sport" />
  </div>
</template>

<style scoped>
.targets {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}
.effort {
  display: grid;
  grid-template-columns: 1.5em auto 1fr;
  grid-template-areas:
    "medal value speed"
    ". title date";
  column-gap: 8px;
  align-items: center;
  padding: 6px 0;
  color: inherit;
  text-decoration: none;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.effort:first-child {
  border-top: none;
}
.effort:hover .title {
  text-decoration: underline;
}
.medal {
  grid-area: medal;
  width: 1.5em;
  height: 1.5em;
  border-radius: 50%;
  color: white;
  font-size: 0.75em;
  font-weight: bold;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.value {
  grid-area: value;
  font-weight: 500;
}
.first .value {
  font-size: 1.25em;
}
.effort > :nth-child(3) {
  grid-area: speed;
  text-align: right;
}
.title {
  grid-area: title;
  font-size: 0.85em;
  min-width: 0;
}
.effort > :nth-child(5) {
  grid-area: date;
  text-align: right;
  font-size: 0.85em;
}
</style>
