<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { useAppStore } from '@/stores/app'
  import { useRoute } from 'vue-router'
  import axios from 'axios'

  const token = localStorage.getItem('msw-token')
  const appStore = useAppStore()
  const route = useRoute('/activity/[id]')
  const activity = ref(null)
  const isLoading = ref(true)
  const panel = ref(0)
  const graphs = ['speed', 'hr', 'cadence', 'altitude', 'power']
  const graphsSwimming = ['hr', 'swolf', 'pace', 'strokes']
  const means = 'means'
  const formattedActivityDate = computed(() => {
    if (!activity.value?.date) return ''

    const date = new Date(activity.value.date)
    return new Intl.DateTimeFormat('fr-FR', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  })

  const formattedActivityDuration = computed(() => {
    const hours = Math.floor(activity.value.duration / 3600)
    const minutes = Math.floor((activity.value.duration % 3600) / 60)
    const remainingSeconds = activity.value.duration % 60

    const formattedHours = String(hours).padStart(2, '0')
    const formattedMinutes = String(minutes).padStart(2, '0')
    const formattedSeconds = String(remainingSeconds).padStart(2, '0')

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`
  })

  const fetchActivity = async () => {
    try {
      isLoading.value = true
      console.log('Getting activity: ', route.params.id)
      const request = axios.create({
        baseURL: import.meta.env.VITE_BACKEND_URL,
        timeout: 1000,
        headers: { Authorization: `Bearer ${token}` },
      })

      const response = await request.get(`/api/v1/activity/${route.params.id}`)
      console.log('Activity:', response.data.activity)
      activity.value = response.data.activity
      if (activity.value) {
        appStore.pageTitle = activity.value.title
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'activité:', error)
    } finally {
      isLoading.value = false
    }
  }
  onMounted(fetchActivity)
</script>

<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="activity">
    <v-container>
      <v-row>
        <h5 class="text-h5"> {{ activity.title }}</h5>
      </v-row>
      <v-row>
        <v-sheet class="d-flex flex-wrap">
          <v-card class="h-auto w-20 ma-2">
            <v-card-title> Sport:</v-card-title>
            <v-card-text> {{ activity.sport }}</v-card-text>
          </v-card>
          <v-card class="h-auto w-20 ma-2">
            <v-card-title> Date: </v-card-title>
            <v-card-text> {{ formattedActivityDate }}</v-card-text>
          </v-card>
          <v-card class="h-auto w-20 ma-2">
            <v-card-title> Duration: </v-card-title>
            <v-card-text> {{ formattedActivityDuration }}</v-card-text>
          </v-card>

          <v-card v-if="activity.avg_speed > 0" class="h-auto w-20 ma-2">
            <v-card-title> Average Speed: </v-card-title>
            <v-card-text> {{ (activity.avg_speed * 3.6).toFixed(2) }} km/h</v-card-text>
          </v-card>
          <v-card v-if="activity.distance > 0" class="h-auto w-20 ma-2">
            <v-card-title> Distance : </v-card-title>
            <v-card-text> {{ (activity.distance / 1000).toFixed(2) }} km</v-card-text>
          </v-card>
          <v-card v-if="activity.kcal > 0" class="h-auto w-15 ma-2">
            <v-card-title> Calories:</v-card-title>
            <v-card-text>  {{ activity.kcal }}</v-card-text>
          </v-card>
          <v-card v-if="activity.avg_rpm > 0" class="h-auto w-20 ma-2">
            <v-card-title>Average Cadence:</v-card-title>
            <v-card-text>  {{ activity.avg_rpm }} rpm</v-card-text>
          </v-card>
          <v-card v-if="activity.avg_hr > 0" class="h-auto w-20 ma-2">
            <v-card-title> Average Heart rate:</v-card-title>
            <v-card-text>  {{ activity.avg_hr }} bpm</v-card-text>
          </v-card>
          <v-card v-if="activity.is_commute" class="h-auto w-20 ma-2">
            <v-card-title> CO2:</v-card-title>
            <v-card-text> {{ (activity.co2 / 1000).toFixed(1) }} kg</v-card-text>
          </v-card>
          <v-card v-if="activity.power_avg > 0" class="h-auto w-20 ma-2">
            <v-card-title> Average Power:</v-card-title>
            <v-card-text> {{ (activity.power_avg).toFixed(1) }} W</v-card-text>
          </v-card>
        </v-sheet>
      </v-row>
      <v-row>
        <Map v-if="activity.public_gps_points !== null " :activity="activity" />
      </v-row>
      <v-row>
        <v-expansion-panels v-model="panel" accordion>
          <v-expansion-panel
            v-if="activity.sport === 'walking' || activity.sport === 'cycling' || activity.sport === 'running' || activity.sport === 'rowing'"
          >
            <Graph-line
              v-for="graph in graphs"
              :key="graph"
              :activity="activity"
              :graph="graph"
              style="height: 200px;  "
            />
            <Graph-bar v-if="activity.means !== null && activity.means.length >0" :activity="activity" :graph="means" />
          </v-expansion-panel>
          <v-expansion-panel
            v-if="activity.sport === 'swimming'"
          >
            <Graph-line v-for="graph in graphsSwimming" :key="graph" :activity="activity" :graph="graph" />
          </v-expansion-panel>
        </v-expansion-panels>
      </v-row>
    </v-container>
  </div>
  <div v-else>Activité non trouvée</div>
</template>

<style scoped lang="sass">

</style>
