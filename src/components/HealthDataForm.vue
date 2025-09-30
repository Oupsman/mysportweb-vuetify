<script setup lang="ts">
import { ref } from 'vue'
import type { Ref } from 'vue'
import { useHealthStore } from '@/stores/health'
import { HealthDatas } from '@/types/health'

const healthStore = useHealthStore()
const weight:Ref<number> = ref(0)
const fat:Ref<number> = ref(0)
const muscle:Ref<number> = ref(0)
const bone:Ref<number> = ref(0)
const bodyWater:Ref<number> = ref(0)
const resthr:Ref<number> = ref(0)
const date:Ref<Date> = ref(new Date())
const vo2max:Ref<number> = ref(0)
const systolic:Ref<number> = ref(0)
const diastolic:Ref<number> = ref(0)

const create = () => {
  const healthdata: HealthDatas = {
    id: '',
    date: date.value.toString(),
    weight: weight.value,
    fat: fat.value,
    muscle: muscle.value,
    bone: bone.value,
    bodyWater: bodyWater.value,
    resthr: resthr.value,
    vo2max: vo2max.value,
    systolic: systolic.value,
    diastolic: diastolic.value,
  }
  healthStore.insertHealthData(healthdata)
}
</script>

<template>
  <v-container>
    <v-card>
      <v-card-title>Equipment</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="create">
          <v-date-picker v-model="date" label="Date of measure" />
          <v-text-field v-model="weight" label="weight" type="number" />
          <v-text-field v-model="fat" label="Fat percentage" type="number" />
          <v-text-field v-model="muscle" label="Muscle percentage" type="number" />
          <v-text-field v-model="bone" label="Bone" type="number" />
          <v-text-field v-model="bodyWater" label="Body Water" type="number" />
          <v-text-field v-model="resthr" label="Rest Heart Rate" type="number" />
          <v-text-field v-model="vo2max" label="Vo2max" type="number" />
          <v-text-field v-model="systolic" label="Blood pressure Systolic" type="number" />
          <v-text-field v-model="diastolic" label="Blood pressure Diastolic" type="number" />
          <v-btn color="primary" type="submit">Create</v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<style scoped lang="sass">

</style>
