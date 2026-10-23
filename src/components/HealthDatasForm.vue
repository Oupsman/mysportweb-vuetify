<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useHealthStore } from '@/stores/health'
  import { useAppStore } from '@/stores/app'
  import type { HealthData, HealthDataFields, HealthValue } from '@/types/health'

  // without measure, the form creates one
  const props = defineProps<{ healthData?: HealthData }>()

  const healthStore = useHealthStore()
  const appStore = useAppStore()

  // the day of the measure, in the local calendar; saved at midnight UTC so it is the same day everywhere
  const localToday = () => {
    const now = new Date()
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
  }
  const today = localToday()

  // empty: not measured, saved as 0
  const value = (field: HealthValue) => props.healthData && props.healthData[field] > 0 ? String(props.healthData[field]) : ''
  const form = ref({
    date: props.healthData ? new Date(props.healthData.date).toISOString().slice(0, 10) : today,
    weight: value('weight'),
    fat: value('fat'),
    muscle: value('muscle'),
    bone: value('bone'),
    body_water: value('body_water'),
    rest_hr: value('rest_hr'),
    vo2max: value('vo2max'),
    systolic: value('systolic'),
    diastolic: value('diastolic'),
  })

  // the limits of the backend
  const range = (max: number, integer = false) => (v: string) => {
    if (v === '') return true
    const n = Number(v)
    if (Number.isNaN(n) || n <= 0 || n > max) return `Between 0 and ${max}`
    return !integer || Number.isInteger(n) || 'A whole number'
  }
  const pressureRule = () => {
    const { systolic, diastolic } = form.value
    if ((systolic === '') !== (diastolic === '')) return 'Both values or none'
    return systolic === '' || Number(systolic) > Number(diastolic) || 'Systolic is above diastolic'
  }
  const fields: { key: HealthValue, label: string, unit: string, rule: (v: string) => true | string }[][] = [
    [
      { key: 'weight', label: 'Weight', unit: 'kg', rule: range(500) },
      { key: 'fat', label: 'Body fat', unit: '%', rule: range(100) },
      { key: 'muscle', label: 'Muscle', unit: '%', rule: range(100) },
      { key: 'body_water', label: 'Body water', unit: '%', rule: range(100) },
      { key: 'bone', label: 'Bone mass', unit: 'kg', rule: range(50) },
    ],
    [
      { key: 'rest_hr', label: 'Resting heart rate', unit: 'bpm', rule: range(250, true) },
      { key: 'vo2max', label: 'VO2max', unit: 'ml/kg/min', rule: range(100, true) },
    ],
  ]
  const sections = ['Body composition', 'Heart']

  const anyValue = computed(() => Object.entries(form.value).some(([key, v]) => key !== 'date' && v !== ''))

  const valid = ref(false)
  const saving = ref(false)
  const error = ref('')

  const save = async () => {
    if (!valid.value || !anyValue.value) {
      return
    }
    const number = (field: HealthValue) => form.value[field] === '' ? 0 : Number(form.value[field])
    const measure: HealthDataFields = {
      date: new Date(form.value.date).toISOString(),
      weight: number('weight'),
      fat: number('fat'),
      muscle: number('muscle'),
      bone: number('bone'),
      body_water: number('body_water'),
      rest_hr: number('rest_hr'),
      vo2max: number('vo2max'),
      systolic: number('systolic'),
      diastolic: number('diastolic'),
    }
    saving.value = true
    error.value = ''
    try {
      if (props.healthData) {
        await healthStore.updateHealthData(props.healthData.id, measure)
      } else {
        await healthStore.insertHealthData(measure)
      }
      appStore.navigateToPage('/health')
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      saving.value = false
    }
  }
</script>

<template>
  <v-card max-width="720">
    <v-card-text>
      <v-alert v-if="error" class="mb-4" type="error">{{ error }}</v-alert>
      <v-form v-model="valid" @submit.prevent="save">
        <v-text-field
          v-model="form.date"
          label="Date"
          :max="today"
          :rules="[v => !!v || 'Required']"
          type="date"
        />
        <div class="text-medium-emphasis text-body-2 mb-2">Fill in what you measured, leave the rest empty.</div>

        <template v-for="(group, index) in fields" :key="sections[index]">
          <div class="text-subtitle-2 mt-2 mb-1">{{ sections[index] }}</div>
          <v-row dense>
            <v-col v-for="field in group" :key="field.key" cols="12" sm="6">
              <v-text-field
                v-model="form[field.key]"
                :label="`${field.label} (${field.unit})`"
                min="0"
                :rules="[field.rule]"
                step="any"
                :suffix="field.unit"
                type="number"
              />
            </v-col>
          </v-row>
        </template>

        <div class="text-subtitle-2 mt-2 mb-1">Blood pressure</div>
        <v-row dense>
          <v-col cols="6">
            <v-text-field
              v-model="form.systolic"
              label="Systolic (mmHg)"
              min="0"
              :rules="[range(300, true), pressureRule]"
              suffix="mmHg"
              type="number"
            />
          </v-col>
          <v-col cols="6">
            <v-text-field
              v-model="form.diastolic"
              label="Diastolic (mmHg)"
              min="0"
              :rules="[range(300, true), pressureRule]"
              suffix="mmHg"
              type="number"
            />
          </v-col>
        </v-row>

        <div class="d-flex align-center ga-2 mt-4">
          <span v-if="!anyValue" class="text-caption text-medium-emphasis">Enter at least one value</span>
          <v-spacer />
          <v-btn variant="text" @click="appStore.navigateToPage('/health')">Cancel</v-btn>
          <v-btn color="primary" :disabled="!valid || !anyValue" :loading="saving" type="submit">
            {{ healthData ? 'Save' : 'Add' }}
          </v-btn>
        </div>
      </v-form>
    </v-card-text>
  </v-card>
</template>
