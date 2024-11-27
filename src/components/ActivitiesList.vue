<script setup lang="ts">
  import { useActivitiesStore } from '@/stores/activities'
  import ActivityCard from '@/components/ActivityCard.vue'
  import type { Activity } from '@/types/activities'

  const activitiesStore = useActivitiesStore()
  const activitiesDisplay = ref<Activity[]>([])

  const pointer = ref(0)
  const number = 100
  let activities:Activity[] = []

  // Define possible scroll sides
  // Taken from documentation https://vuetifyjs.com/en/components/infinite-scroller/
  type InfiniteScrollSide = 'end' | 'start' | 'both'

  // Define possible status values
  // Taken from documentation https://vuetifyjs.com/en/components/infinite-scroller/
  type InfiniteScrollStatus = 'ok' | 'error' | 'loading' | 'empty'

  interface InfiniteScrollOptions {
    side: InfiniteScrollSide;
    done: (status: InfiniteScrollStatus) => void;
  }

  async function load ({ side, done }: InfiniteScrollOptions): Promise<void> {
    try {
      console.log('Loading more activities')
      pointer.value += number
      const newActivities = await activitiesStore.getActivities(pointer.value, number)

      if (newActivities.length > 0) {
        activitiesDisplay.value.push(...newActivities)
        done('ok')
      } else {
        done('empty')
      }
    } catch (error) {
      console.error('Error loading more activities:', error)
      done('error')
    }
  }
  onMounted(async () => {
    try {
      activities = await activitiesStore.getActivities(pointer.value, number)
      console.log('Initial activities:', activities)

      if (activities.length === 0) {
        console.warn('No activity found')
      }

      activitiesDisplay.value = activities
    } catch (error) {
      console.error('Error during activities fetch :', error)
    }
  })
</script>

<template>
  <v-infinite-scroll :height="600" @load="load">
    <template v-if="activitiesDisplay.length > 0">
      <v-container class="d-flex align-start flex-wrap mb-6">
        <ActivityCard v-for="activity in activitiesDisplay" :key="activity.id" :activity="activity" />
      </v-container>
    </template>
    <template v-else>
      <v-container>
        <p>No activity to display</p>
      </v-container>
    </template>
  </v-infinite-scroll>
</template>

<style scoped lang="sass">

</style>
