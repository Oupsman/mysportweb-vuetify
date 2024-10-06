<script setup lang="ts">
  import { useActivitiesStore } from '@/stores/activities'
  import ActivityCard from '@/components/ActivityCard.vue'

  const activitiesStore = useActivitiesStore()
  const activitiesDisplay = ref([])
  const pointer = ref(0)

  async function load ({ done }) {
    const newActivities = activitiesStore.activities.slice(pointer.value, pointer.value + 100)
    pointer.value += 20
    activitiesDisplay.value.push(...newActivities)
    done('ok')
  }

  onMounted(() => {
    activitiesStore.getActivities()
  })

</script>

<template>
  <v-infinite-scroll :height="600" :items="activitiesDisplay" :onLoad="load">
    <v-container class="d-flex align-start flex-wrap mb-6">
      <ActivityCard v-for="activity in activitiesDisplay" :key="activity.id" :activity="activity" />
    </v-container>
  </v-infinite-scroll>
</template>

<style scoped lang="sass">

</style>
