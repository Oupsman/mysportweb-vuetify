<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useRoute } from 'vue-router'
  import { useActivitiesStore } from '@/stores/activities' // Ajustez le chemin selon votre structure
  import { useAppStore } from '@/stores/app' // Ajustez le chemin selon votre structure

  const route = useRoute()
  const activitiesStore = useActivitiesStore()
  const appStore = useAppStore()

  const activity = ref(null)
  const isLoading = ref(true)
  const panel = ref(0)
  const graphs = ['speed', 'hr']
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

  const fetchActivity = async () => {
    try {
      isLoading.value = true
      activity.value = await activitiesStore.getActivity(route.params.id)
      console.log('Fetched activity:', activity.value)
      if (activity.value) {
        appStore.pageTitle = activity.value.title
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'activité:', error)
    } finally {
      isLoading.value = false
    }
  }

  watchEffect(() => {
    console.log('Activity changed:', activity.value)
  })
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
          <v-card class="h-auto w-20">
            <v-card-title> Sport:</v-card-title>
            <v-card-text> {{ activity.sport }}</v-card-text>
          </v-card>
          <v-card class="h-auto w-20">
            <v-card-title> Date: </v-card-title>
            <v-card-text> {{ formattedActivityDate   }}</v-card-text>
          </v-card>
          <v-card v-if="activity.avg_speed > 0" class="h-auto w-20">
            <v-card-title> Average Speed: </v-card-title>
            <v-card-text> {{ (activity.avg_speed * 3.6).toFixed(2) }} km/h</v-card-text>
          </v-card>
          <v-card v-if="activity.distance > 0" class="h-auto w-20">
            <v-card-title> Distance : </v-card-title>
            <v-card-text> {{ (activity.distance / 1000).toFixed(2) }} km</v-card-text>
          </v-card>
          <v-card v-if="activity.kcal > 0" class="h-auto w-15">
            <v-card-title> Calories:</v-card-title>
            <v-card-text>  {{ activity.kcal }}</v-card-text>
          </v-card>
          <v-card v-if="activity.avg_rpm > 0" class="h-auto w-20">
            <v-card-title>Average Cadence:</v-card-title>
            <v-card-text>  {{ activity.avg_rpm }} rpm</v-card-text>
          </v-card>
          <v-card v-if="activity.avg_hr > 0" class="h-auto w-20">
            <v-card-title> Average Heart rate:</v-card-title>
            <v-card-text>  {{ activity.avg_hr }} bpm</v-card-text>
          </v-card>
          <v-card v-if="activity.is_commute" class="h-auto w-20">
            <v-card-title> CO2:</v-card-title>
            <v-card-text> {{ (activity.co2 / 1000).toFixed(1) }}</v-card-text>
          </v-card>
        </v-sheet>
      </v-row>

      <v-row>
        <v-expansion-panels v-model="panel" accordion>
          <v-expansion-panel class="h-150">
            <Graph-line v-for="graph in graphs" :key="graph" :graph="graph" :activity="activity" />
          </v-expansion-panel>
        </v-expansion-panels>
      </v-row>
    </v-container>
  </div>
  <div v-else>Activité non trouvée</div>
</template>

<style scoped lang="sass">

</style>
