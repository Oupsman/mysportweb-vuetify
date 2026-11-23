<script setup lang="ts">
  import { computed, ref } from 'vue'
  import WeeklyVolumeChart from '@/components/WeeklyVolumeChart.vue'
  import { useUserStore } from '@/stores/user'

  const userStore = useUserStore()
  const dashboard = computed(() => userStore.dashboard)
  const metric = ref<'distance' | 'duration'>('distance')
</script>

<template>
  <v-card class="widget-card">
    <v-card-item>
      <v-card-title>Last {{ dashboard.week_starts.length }} weeks</v-card-title>
      <template #append>
        <v-btn-toggle
          v-model="metric"
          color="primary"
          density="compact"
          mandatory
          variant="outlined"
        >
          <v-btn value="distance">Distance</v-btn>
          <v-btn value="duration">Time</v-btn>
        </v-btn-toggle>
      </template>
    </v-card-item>
    <v-card-text>
      <WeeklyVolumeChart :metric="metric" :volumes="dashboard.weekly" :weeks="dashboard.week_starts" />
    </v-card-text>
  </v-card>
</template>
