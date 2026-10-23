<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { mdiHeartPulse, mdiPlus } from '@mdi/js'
  import HealthChart from '@/components/HealthChart.vue'
  import HealthDatasTable from '@/components/HealthDatasTable.vue'
  import HealthSummary from '@/components/HealthSummary.vue'
  import { useAppStore } from '@/stores/app'
  import { useHealthStore } from '@/stores/health'
  import type { HealthData } from '@/types/health'
  import { formatMeasureDate } from '@/utils/health'

  const appStore = useAppStore()
  const healthStore = useHealthStore()

  const isLoading = ref(true)
  const error = ref('')
  // the measure being deleted
  const busy = ref<number | null>(null)

  onMounted(async () => {
    try {
      await healthStore.getAllHealthDatas()
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      isLoading.value = false
    }
  })

  const add = () => appStore.navigateToPage('/health/add')
  const edit = (data: HealthData) => appStore.navigateToPage(`/health/${data.id}/edit`)
  const remove = async (data: HealthData) => {
    if (!confirm(`Delete the measure of ${formatMeasureDate(data.date)}?`)) {
      return
    }
    error.value = ''
    busy.value = data.id
    try {
      await healthStore.deleteHealthData(data.id)
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      busy.value = null
    }
  }
</script>

<template>
  <v-container>
    <div class="d-flex align-center mb-4">
      <h2 class="text-h4">Health</h2>
      <v-spacer />
      <v-btn color="primary" :prepend-icon="mdiPlus" @click="add">Add a measure</v-btn>
    </div>

    <v-alert
      v-if="error"
      class="mb-4"
      closable
      type="error"
      @click:close="error = ''"
    >{{ error }}</v-alert>

    <div v-if="isLoading">Loading...</div>
    <v-card v-else-if="healthStore.healthDatas.length === 0" class="pa-8 text-center">
      <v-icon class="mb-2" :icon="mdiHeartPulse" size="x-large" />
      <div class="text-h6">No measure yet</div>
      <div class="text-medium-emphasis mb-4">
        Record your weight, body composition, resting heart rate or blood pressure to follow their trend.
      </div>
      <v-btn color="primary" :prepend-icon="mdiPlus" @click="add">Add a measure</v-btn>
    </v-card>
    <template v-else>
      <HealthSummary class="mb-2" :datas="healthStore.healthDatas" />
      <HealthChart class="mb-6" :datas="healthStore.healthDatas" />
      <HealthDatasTable :busy="busy" :datas="healthStore.healthDatas" @delete="remove" @edit="edit" />
    </template>
  </v-container>
</template>
