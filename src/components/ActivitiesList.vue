<script setup lang="ts">
  import { useActivitiesStore } from '@/stores/activities'
  import ActivityCard from '@/components/ActivityCard.vue'

  const activitiesStore = useActivitiesStore()

  onMounted(() => {
    activitiesStore.getActivities()
  })

</script>

<template>
  <v-container>
    <v-sheet class="d-flex align-start flex-wrap mb-6 w-100 h-auto">
      <ActivityCard v-for="activity in activitiesStore.activities" :key="activity.id" :activity="activity" />
    </v-sheet>
  </v-container>
</template>

<style scoped lang="sass">

</style>
