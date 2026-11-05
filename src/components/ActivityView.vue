<script setup lang="ts">
  import { computed, onMounted, provide, ref, shallowRef, watch } from 'vue'
  import { useAppStore } from '@/stores/app'
  import { useUserStore } from '@/stores/user'
  import { useRoute } from 'vue-router'
  import { useDisplay } from 'vuetify'
  import { api } from '@/api'
  import { activityCursorKey } from '@/composables/activityCursor'
  import MultisportLegs from '@/components/MultisportLegs.vue'
  import { sportLabel } from '@/utils/format'

  const appStore = useAppStore()
  const route = useRoute('/activity/[id]')
  // shallow: the activity holds every record of the FIT file, Vue doesn't need to track them
  const activity = shallowRef(null)
  // time hovered on a chart, shared with the other charts and the map
  const cursor = ref<number | null>(null)
  provide(activityCursorKey, cursor)
  const isLoading = ref(true)
  // every sport but swimming: each graph shows only when the activity has its data
  const graphs = ['speed', 'hr', 'cadence', 'altitude', 'power', 'temperature']
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
      cursor.value = null
      console.log('Getting activity: ', route.params.id)
      const response = await api.get(`/api/v1/activity/${route.params.id}`)
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
  // the router reuses this component when going from an activity to another one
  watch(() => route.params.id, fetchActivity)

  const userStore = useUserStore()
  // the list of activities on the same route is only available to the owner
  const isOwner = computed(() => activity.value !== null && userStore.session?.sub === activity.value.user_id)
  const showSimilar = computed(() => isOwner.value && !!activity.value?.route_id)
  // a triathlon...: one activity made of the sessions of the FIT file
  const hasLegs = computed(() => (activity.value?.legs?.length ?? 0) > 1)
  // the speed per km, of the activities with a distance
  const hasMeans = computed(() => (activity.value?.means ?? []).some((m: number) => m > 0))
  // the owner gets the whole trace; the public trace, without the privacy zones, is empty for a short loop
  const hasMap = computed(() => !!(activity.value?.gps_points?.length || activity.value?.public_gps_points?.length))

  // large screens: the map on the left half, as high as the screen, next to the graphs
  const { lgAndUp } = useDisplay()
  const mapHeight = computed(() => lgAndUp.value ? 'calc(100vh - 64px - 48px - 32px)' : '50vh')

  // the route's commute flag changed: the backend may have computed the CO2 of this activity
  const onRouteCommute = async () => {
    try {
      const updated = (await api.get(`/api/v1/activity/${route.params.id}`)).data.activity
      if (activity.value && activity.value.id === updated.id) {
        activity.value.is_commute = updated.is_commute
        activity.value.co2 = updated.co2
      }
    } catch (error) {
      console.error('Refresh commute error:', error)
    }
  }
</script>

<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="activity" :key="activity.id">
    <v-container class="pa-4" fluid>
      <h5 class="text-h5 mb-2">{{ activity.title }}</h5>
      <!-- the figures fill the width, as many per line as the screen holds -->
      <div class="stats mb-4">
        <v-card density="compact">
          <v-card-subtitle class="pt-2">Sport</v-card-subtitle>
          <v-card-text class="text-h6 pt-1">{{ sportLabel(activity.sport) }}</v-card-text>
        </v-card>
        <v-card density="compact">
          <v-card-subtitle class="pt-2">Date</v-card-subtitle>
          <v-card-text class="text-h6 pt-1">{{ formattedActivityDate }}</v-card-text>
        </v-card>
        <!-- hidden when the FIT file doesn't tell the device (an activity entered by hand) -->
        <v-card v-if="activity.device_name" density="compact">
          <v-card-subtitle class="pt-2">Device</v-card-subtitle>
          <v-card-text class="text-h6 pt-1">
            {{ activity.device_name }}
            <div v-if="activity.device?.software" class="text-caption text-medium-emphasis">
              firmware {{ activity.device.software }}
            </div>
          </v-card-text>
        </v-card>
        <v-card density="compact">
          <v-card-subtitle class="pt-2">Duration</v-card-subtitle>
          <v-card-text class="text-h6 pt-1">{{ formattedActivityDuration }}</v-card-text>
        </v-card>
        <v-card v-if="activity.distance > 0" density="compact">
          <v-card-subtitle class="pt-2">Distance</v-card-subtitle>
          <v-card-text class="text-h6 pt-1">{{ (activity.distance / 1000).toFixed(2) }} km</v-card-text>
        </v-card>
        <v-card v-if="activity.avg_speed > 0" density="compact">
          <v-card-subtitle class="pt-2">Average speed</v-card-subtitle>
          <v-card-text class="text-h6 pt-1">{{ (activity.avg_speed * 3.6).toFixed(2) }} km/h</v-card-text>
        </v-card>
        <v-card v-if="activity.kcal > 0" density="compact">
          <v-card-subtitle class="pt-2">Calories</v-card-subtitle>
          <v-card-text class="text-h6 pt-1">{{ activity.kcal }}</v-card-text>
        </v-card>
        <v-card v-if="activity.avg_rpm > 0" density="compact">
          <v-card-subtitle class="pt-2">Average cadence</v-card-subtitle>
          <v-card-text class="text-h6 pt-1">{{ activity.avg_rpm }} rpm</v-card-text>
        </v-card>
        <v-card v-if="activity.avg_hr > 0" density="compact">
          <v-card-subtitle class="pt-2">Average heart rate</v-card-subtitle>
          <v-card-text class="text-h6 pt-1">{{ activity.avg_hr }} bpm</v-card-text>
        </v-card>
        <v-card v-if="activity.power_avg > 0" density="compact">
          <v-card-subtitle class="pt-2">Average power</v-card-subtitle>
          <v-card-text class="text-h6 pt-1">{{ (activity.power_avg).toFixed(1) }} W</v-card-text>
        </v-card>
        <v-card v-if="activity.is_commute" density="compact">
          <v-card-subtitle class="pt-2">CO2</v-card-subtitle>
          <v-card-text class="text-h6 pt-1">{{ (activity.co2 / 1000).toFixed(1) }} kg</v-card-text>
        </v-card>
      </div>
      <v-row v-if="hasLegs">
        <v-col cols="12">
          <MultisportLegs :legs="activity.legs" />
        </v-col>
      </v-row>
      <!-- large screens: the map stays in view on the left while the graphs scroll on the right; stacked otherwise -->
      <v-row>
        <v-col v-if="hasMap" class="map-col" cols="12" lg="6">
          <Map :activity="activity" :height="mapHeight" />
        </v-col>
        <v-col cols="12" :lg="hasMap ? 6 : 12">
          <v-card>
            <template v-if="hasLegs || activity.sport !== 'swimming'">
              <Graph-line v-for="graph in graphs" :key="graph" :activity="activity" :graph="graph" />
              <Graph-bar v-if="hasMeans" :activity="activity" :graph="means" />
            </template>
            <template v-if="activity.sport === 'swimming'">
              <Graph-line v-for="graph in graphsSwimming" :key="graph" :activity="activity" :graph="graph" />
            </template>
          </v-card>
        </v-col>
      </v-row>
      <v-row v-if="showSimilar">
        <v-col cols="12">
          <SimilarActivities :activity="activity" @commute="onRouteCommute" />
        </v-col>
      </v-row>
    </v-container>
  </div>
  <div v-else>Activité non trouvée</div>
</template>

<style scoped lang="sass">
.stats
  display: grid
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr))
  gap: 8px

// below the app bar (64px) and the container padding
@media (min-width: 1280px)
  .map-col
    position: sticky
    top: 80px
    align-self: flex-start
</style>
