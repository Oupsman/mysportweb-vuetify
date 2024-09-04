<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { useAppStore } from '@/stores/app'
  import { useUserStore } from '@/stores/user'
  import { useActivitiesStore } from '@/stores/activities'

  import { useRoute } from 'vue-router'

  const userStore = useUserStore()
  const appStore = useAppStore()
  const activitiesStore = useActivitiesStore()

  const route = useRoute()
  const activity = ref('')

  activitiesStore.getActivity(route.params.id)
  activity.value = activitiesStore.activity
  const date = computed(() => {
    const d = new Date(activity.value.date)
    return d.getDay() + '/' + d.getMonth() + '/' + d.getFullYear() + ' ' + d.getHours() + ':' + d.getMinutes()
  })
</script>

<template>
  <v-container>
    <v-row>
      <h5 class="text-h5"> {{ activitiesStore.activity.title }}</h5>
    </v-row>
    <v-row>
      <v-sheet class="d-flex flex-wrap">
        <v-card class="h-auto w-20">
          <v-card-title> Sport:</v-card-title>
          <v-card-text> {{ activitiesStore.activity.sport }}</v-card-text>
        </v-card>
        <v-card class="h-auto w-20">
          <v-card-title> Date: </v-card-title>
          <v-card-text> {{ date }}</v-card-text>
        </v-card>
        <v-card v-if="activitiesStore.activity.avg_speed > 0" class="h-auto w-20">
          <v-card-title> Average Speed: </v-card-title>
          <v-card-text> {{ (activitiesStore.activity.avg_speed * 3.6).toFixed(2) }} km/h</v-card-text>
        </v-card>
        <v-card v-if="activitiesStore.activity.distance > 0" class="h-auto w-20">
          <v-card-title> Distance : </v-card-title>
          <v-card-text> {{ (activitiesStore.activity.distance / 1000).toFixed(2) }} km</v-card-text>
        </v-card>
        <v-card v-if="activitiesStore.activity.kcal > 0" class="h-auto w-15">
          <v-card-title> Calories:</v-card-title>
          <v-card-text>  {{ activitiesStore.activity.kcal }}</v-card-text>
        </v-card>
        <v-card v-if="activitiesStore.activity.avg_rpm > 0" class="h-auto w-20">
          <v-card-title>Average Cadence:</v-card-title>
          <v-card-text>  {{ activitiesStore.activity.avg_rpm }} rpm</v-card-text>
        </v-card>
        <v-card v-if="activitiesStore.activity.avg_hr > 0" class="h-auto w-20">
          <v-card-title> Average Heart rate:</v-card-title>
          <v-card-text>  {{ activitiesStore.activity.avg_hr }} bpm</v-card-text>
        </v-card>
        <v-card v-if="activitiesStore.activity.is_commute" class="h-auto w-20">
          <v-card-title> CO2:</v-card-title>
          <v-card-text> {{ (activitiesStore.activity.co2 / 1000).toFixed(1) }}</v-card-text>
        </v-card>
      </v-sheet>
    </v-row>
  </v-container>
</template>

<style scoped lang="sass">

</style>
