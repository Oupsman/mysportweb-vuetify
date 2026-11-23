<script setup lang="ts">
  import ActivityMonth from '@/components/ActivityMonth.vue'
  import { useAppStore } from '@/stores/app'
  import { useUserStore } from '@/stores/user'

  const userStore = useUserStore()
  const appStore = useAppStore()
</script>

<template>
  <v-card class="widget-card">
    <v-card-title>Calendar</v-card-title>
    <v-card-text>
      <ActivityMonth :activities="userStore.dashboard.calendar" @open="id => appStore.navigateToPage(`/activity/${id}`)" />
    </v-card-text>
  </v-card>
</template>
