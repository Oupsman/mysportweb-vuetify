<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import HealthDatasForm from '@/components/HealthDatasForm.vue'
  import { useHealthStore } from '@/stores/health'

  const route = useRoute('/health/[id]/edit')
  const healthStore = useHealthStore()

  const isLoading = ref(true)
  const error = ref('')
  // there is no endpoint for one measure: it is found in the list
  const healthData = computed(() => healthStore.healthDatas.find(d => String(d.id) === route.params.id))

  onMounted(async () => {
    try {
      if (!healthData.value) {
        await healthStore.getAllHealthDatas()
      }
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      isLoading.value = false
    }
  })
</script>

<template>
  <v-container>
    <h2 class="text-h4 mb-4">Edit measure</h2>
    <div v-if="isLoading">Loading...</div>
    <v-alert v-else-if="error" type="error">{{ error }}</v-alert>
    <!-- keyed: the form copies the measure once -->
    <HealthDatasForm v-else-if="healthData" :key="healthData.id" :health-data="healthData" />
    <v-alert v-else type="warning">This measure doesn't exist</v-alert>
  </v-container>
</template>
