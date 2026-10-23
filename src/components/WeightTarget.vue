<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { mdiFlagCheckered, mdiPencilOutline, mdiTrendingDown, mdiTrendingNeutral, mdiTrendingUp } from '@mdi/js'
  import { useHealthStore } from '@/stores/health'

  const healthStore = useHealthStore()
  const estimate = computed(() => healthStore.weightTarget)

  const kg = (value: number, decimals = 1) =>
    `${value.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} kg`
  const pace = (perWeek: number) => `${perWeek > 0 ? '+' : ''}${kg(perWeek, 2)}/week`
  const paceIcon = computed(() => {
    const perWeek = estimate.value?.per_week ?? 0
    return perWeek <= -0.01 ? mdiTrendingDown : perWeek >= 0.01 ? mdiTrendingUp : mdiTrendingNeutral
  })

  // "in 5 weeks", "in 4 months": a trend is an approximation, the date is given with it
  const delay = (date: string) => {
    const days = Math.round((new Date(date).getTime() - Date.now()) / 86_400_000)
    if (days <= 0) return 'any day now'
    if (days < 14) return `in ${days} days`
    if (days < 70) return `in ${Math.round(days / 7)} weeks`
    if (days < 730) return `in ${Math.round(days / 30.4)} months`
    return `in ${(days / 365).toFixed(1).replace('.', ',')} years`
  }

  // the date, in the timezone of the browser: it's a day to come, not a measure
  const day = (date: string) =>
    new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date))

  const editing = ref(false)
  const value = ref('')
  const saving = ref(false)
  const error = ref('')
  const latestWeight = computed(() => healthStore.healthDatas.find(d => d.weight > 0)?.weight)

  const edit = () => {
    value.value = estimate.value?.target ? String(estimate.value.target) : ''
    error.value = ''
    editing.value = true
  }
  const rule = (v: string) => (v !== '' && Number(v) >= 20 && Number(v) <= 500) || 'Between 20 and 500 kg'

  const save = async (target: number) => {
    saving.value = true
    error.value = ''
    try {
      await healthStore.setWeightTarget(target)
      editing.value = false
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      saving.value = false
    }
  }
</script>

<template>
  <v-card class="h-100">
    <v-card-item>
      <template #prepend>
        <v-icon :icon="mdiFlagCheckered" />
      </template>
      <v-card-title>Target weight</v-card-title>
      <template v-if="estimate?.target && !editing" #append>
        <v-btn
          :icon="mdiPencilOutline"
          size="small"
          title="Change the target"
          variant="text"
          @click="edit"
        />
      </template>
    </v-card-item>

    <v-card-text>
      <v-alert v-if="error" class="mb-3" density="compact" type="error">{{ error }}</v-alert>

      <v-form v-if="editing" @submit.prevent="save(Number(value))">
        <div class="d-flex align-start ga-2">
          <v-text-field
            v-model="value"
            autofocus
            density="compact"
            :hint="latestWeight ? `Last measure: ${kg(latestWeight)}` : undefined"
            label="Target"
            persistent-hint
            :rules="[rule]"
            step="0.1"
            suffix="kg"
            type="number"
          />
          <v-btn color="primary" :disabled="rule(value) !== true" :loading="saving" type="submit">Save</v-btn>
        </div>
        <div class="d-flex mt-2">
          <v-btn
            v-if="estimate?.target"
            color="error"
            :disabled="saving"
            size="small"
            variant="text"
            @click="save(0)"
          >Remove the target</v-btn>
          <v-spacer />
          <v-btn :disabled="saving" size="small" variant="text" @click="editing = false">Cancel</v-btn>
        </div>
      </v-form>

      <template v-else-if="!estimate || estimate.status === 'no_target'">
        <div class="text-medium-emphasis mb-3">Set a target to know when you'll get there at your current pace.</div>
        <v-btn color="primary" variant="tonal" @click="edit">Set a target</v-btn>
      </template>

      <template v-else>
        <div class="text-h5 font-weight-medium">{{ kg(estimate.target) }}</div>

        <div v-if="estimate.status === 'reached'" class="mt-2">
          <v-chip color="success" :prepend-icon="mdiFlagCheckered" size="small">Reached</v-chip>
          <span class="ml-2 text-medium-emphasis">last measure {{ kg(estimate.current) }}</span>
        </div>

        <template v-else-if="estimate.status === 'not_enough_data'">
          <div class="mt-2 text-medium-emphasis">
            Not enough recent measures to estimate a date: it takes at least 3 weight measures over 2 weeks,
            in the last 60 days ({{ estimate.measures }} so far).
          </div>
        </template>

        <template v-else>
          <div class="d-flex align-center ga-1 mt-2 text-body-2">
            <v-icon :icon="paceIcon" size="small" />
            <span>{{ pace(estimate.per_week) }}, {{ kg(estimate.current) }} today on the trend</span>
          </div>
          <div v-if="estimate.status === 'on_track' && estimate.date" class="mt-2">
            <span class="text-body-1 font-weight-medium">Around {{ day(estimate.date) }}</span>
            <span class="text-medium-emphasis">, {{ delay(estimate.date) }}</span>
          </div>
          <div v-else-if="estimate.status === 'too_slow'" class="mt-2 text-medium-emphasis">
            More than 3 years at this pace.
          </div>
          <div v-else class="mt-2 text-medium-emphasis">
            {{ Math.abs(estimate.per_week) < 0.01 ? 'Your weight is stable' : 'The trend goes away from the target' }}:
            no date at this pace.
          </div>
          <div class="text-caption text-medium-emphasis mt-2">
            From the trend of your {{ estimate.measures }} weight measures of the last 60 days.
          </div>
        </template>
      </template>
    </v-card-text>
  </v-card>
</template>
