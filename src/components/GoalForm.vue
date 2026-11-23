<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import type { PropType } from 'vue'
  import { useEquipmentsStore } from '@/stores/equipments'
  import { useGoalsStore } from '@/stores/goals'
  import type { Goal, GoalInput } from '@/types/goals'
  import { isoDay } from '@/utils/efforts'
  import { sportIcon, sportLabel } from '@/utils/format'
  import { describeGoal, goalMetrics, goalPeriods, metricOf } from '@/utils/goals'

  // creates a goal, or edits goal
  const props = defineProps({
    goal: {
      type: Object as PropType<Goal | null>,
      default: null,
    },
  })
  const emit = defineEmits<{ saved: [goal: Goal], cancel: [] }>()
  const goalsStore = useGoalsStore()
  const equipmentsStore = useEquipmentsStore()

  const today = new Date()
  const form = ref({
    name: props.goal?.name ?? '',
    metric: props.goal?.metric ?? 'distance',
    // in the unit of the metric: km, hours, m, activities
    target: props.goal ? props.goal.target / metricOf(props.goal.metric).factor : 100 as number | string,
    sports: [...(props.goal?.sports ?? [])],
    period: props.goal?.period ?? 'week',
    starts_on: props.goal?.starts_on ?? isoDay(today),
    ends_on: props.goal?.ends_on ?? isoDay(new Date(today.getFullYear(), today.getMonth() + 3, today.getDate())),
  } as Omit<GoalInput, 'target'> & { target: number | string, starts_on: string, ends_on: string })
  const unit = computed(() => metricOf(form.value.metric))

  // the sports to choose from: the user's first, then every other one (typing filters them)
  const userSports = ref<string[]>([])
  const allSports = ref<string[]>([])
  const sportsError = ref('')
  onMounted(async () => {
    try {
      const sports = await equipmentsStore.getSports()
      userSports.value = sports.sports
      allSports.value = sports.all
    } catch (e) {
      sportsError.value = (e as Error).message
    }
  })
  const sportItems = computed(() => [
    ...userSports.value,
    ...allSports.value.filter(s => !userSports.value.includes(s)),
  ].map(sport => ({ title: sportLabel(sport), value: sport })))

  const positive = (v: number | string) => Number(v) > 0 || 'Above 0'
  const datesValid = computed(() => form.value.period !== 'custom' ||
    (form.value.starts_on !== '' && form.value.ends_on !== '' && form.value.ends_on >= form.value.starts_on))
  const valid = computed(() => Number(form.value.target) > 0 && datesValid.value)

  const input = computed((): GoalInput => ({
    name: form.value.name.trim(),
    metric: form.value.metric,
    target: Number(form.value.target) * unit.value.factor,
    sports: form.value.sports,
    period: form.value.period,
    starts_on: form.value.period === 'custom' ? form.value.starts_on : null,
    ends_on: form.value.period === 'custom' ? form.value.ends_on : null,
  }))

  const saving = ref(false)
  const error = ref('')
  const save = async () => {
    saving.value = true
    error.value = ''
    try {
      emit('saved', await goalsStore.save(input.value, props.goal?.id))
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      saving.value = false
    }
  }
</script>

<template>
  <v-card :title="goal ? 'Edit goal' : 'New goal'">
    <v-card-text>
      <v-alert v-if="error" class="mb-4" type="error">{{ error }}</v-alert>
      <v-row dense>
        <v-col cols="12" sm="5">
          <v-select
            v-model="form.metric"
            item-title="title"
            item-value="value"
            :items="goalMetrics"
            label="Measure"
          />
        </v-col>
        <v-col cols="12" sm="7">
          <v-text-field
            v-model="form.target"
            label="Target"
            min="0"
            :rules="[positive]"
            :step="form.metric === 'activities' ? 1 : 'any'"
            :suffix="unit.unit"
            type="number"
          />
        </v-col>
        <v-col cols="12">
          <v-select
            v-model="form.period"
            item-title="title"
            item-value="value"
            :items="goalPeriods"
            label="Period"
          />
        </v-col>
        <template v-if="form.period === 'custom'">
          <v-col cols="6">
            <v-text-field v-model="form.starts_on" label="From" type="date" />
          </v-col>
          <v-col cols="6">
            <v-text-field
              v-model="form.ends_on"
              :error-messages="datesValid ? [] : ['After the start']"
              label="To (included)"
              :min="form.starts_on"
              type="date"
            />
          </v-col>
        </template>
        <v-col cols="12">
          <v-autocomplete
            v-model="form.sports"
            chips
            closable-chips
            :error-messages="sportsError"
            hint="Leave empty to count every sport"
            :items="sportItems"
            label="Sports"
            multiple
            persistent-hint
            placeholder="All sports"
          >
            <template #chip="{ props: chipProps, item }">
              <v-chip v-bind="chipProps" :prepend-icon="sportIcon(item.value)" />
            </template>
          </v-autocomplete>
        </v-col>
        <v-col cols="12">
          <v-text-field
            v-model="form.name"
            class="mt-2"
            counter="100"
            hint="Optional, e.g. the race you train for"
            label="Name"
            maxlength="100"
            persistent-hint
          />
        </v-col>
      </v-row>
      <div class="text-body-2 text-medium-emphasis mt-4">{{ describeGoal(input) }}</div>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn :disabled="saving" @click="emit('cancel')">Cancel</v-btn>
      <v-btn
        color="primary"
        :disabled="!valid"
        :loading="saving"
        variant="flat"
        @click="save"
      >Save</v-btn>
    </v-card-actions>
  </v-card>
</template>
