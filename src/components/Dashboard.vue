<script setup lang="ts">
  import ActivityCard from '@/components/ActivityCard.vue'
  import { useUserStore } from '@/stores/user'
  import { useAppStore } from '@/stores/app'
  import { ref } from 'vue'
  const userStore = useUserStore()
  const appStore = useAppStore()
  const value = new Date()
</script>

<template>
  <v-container v-if="userStore.userIsLoggedIn">
    <v-row>
      <h5 class="text-h5">Dashboard</h5>
    </v-row>
    <v-row>
      <v-btn v-if="userStore.dashboard.nb_equipments === 0" @click="appStore.navigateToPage('/equipment/add')">Add an equipment</v-btn>
      <v-sheet class="d-flex flex-wrap">
        <v-card>
          <v-card-title>
            <h5 class="text-h5">Equipments</h5>
          </v-card-title>
          <v-card-text>
            <p>{{ userStore.dashboard.nb_equipments }}</p>
          </v-card-text>
        </v-card>
        <v-card>
          <v-card-title>
            <h5 class="text-h5">Activities</h5>
          </v-card-title>
          <v-card-text>
            <p>{{ userStore.dashboard.nb_activities }}</p>
          </v-card-text>
        </v-card>
        <v-card>
          <v-card-title>
            <h5 class="text-h5">Total distance</h5>
          </v-card-title>
          <v-card-text>
            <p>{{ (userStore.dashboard.total_distance).toFixed(1) }} km </p>
          </v-card-text>
        </v-card>
        <v-card>
          <v-card-title>
            <h5 class="text-h5">Total duration</h5>
          </v-card-title>
          <v-card-text>
            <p>{{ userStore.dashboard.total_duration }} </p>
          </v-card-text>
        </v-card>
      </v-sheet>
    </v-row>
    <v-row>
      <v-col class="w-25">
        <h5>Calendar</h5>
        <v-calendar
          ref="calendar"
          v-model="value"
          :events="userStore.dashboard.activities_calendar"
        />
      </v-col>
      <v-col class="w-75">
        <h5>10 last activities</h5>
        <v-container>
          <v-sheet class="d-flex align-start flex-wrap mb-6 w-100 h-auto">
            <ActivityCard v-for="activity in userStore.dashboard.activities" :key="activity.id" :activity="activity" />
          </v-sheet>
        </v-container>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped lang="sass">

</style>
