<script setup lang="ts">
  import { computed, onMounted, provide, ref, shallowRef, watch } from 'vue'
  import { useAppStore } from '@/stores/app'
  import { useUserStore } from '@/stores/user'
  import { useRoute, useRouter } from 'vue-router'
  import { mdiDeleteOutline, mdiPencilOutline } from '@mdi/js'
  import { useActivitiesStore } from '@/stores/activities'
  import { api } from '@/api'
  import { activityCursorKey } from '@/composables/activityCursor'
  import MultisportLegs from '@/components/MultisportLegs.vue'
  import ActivityHrZones from '@/components/ActivityHrZones.vue'
  import ActivityPowerZones from '@/components/ActivityPowerZones.vue'
  import ActivityPowerCurve from '@/components/ActivityPowerCurve.vue'
  import ActivityBestEfforts from '@/components/ActivityBestEfforts.vue'
  import ActivitySegments from '@/components/ActivitySegments.vue'
  import ActivityHighlights from '@/components/ActivityHighlights.vue'
  import ActivityWeather from '@/components/ActivityWeather.vue'
  import RouteProgress from '@/components/RouteProgress.vue'
  import type { SimilarActivity } from '@/types/activities'
  import { formatSpeedFor, sportLabel, usesPace } from '@/utils/format'

  const appStore = useAppStore()
  const route = useRoute('/activity/[id]/')
  // shallow: the activity holds every record of the FIT file, Vue doesn't need to track them
  const activity = shallowRef(null)
  // time hovered on a chart, shared with the other charts and the map
  const cursor = ref<number | null>(null)
  provide(activityCursorKey, cursor)
  const isLoading = ref(true)
  // every sport but swimming: each graph shows only when the activity has its data
  const graphs = ['speed', 'hr', 'cadence', 'altitude', 'power', 'temperature']
  const graphsSwimming = ['hr', 'swolf', 'pace', 'strokes']
  // running dynamics, shown only when a sensor recorded them
  const graphsRunning = [
    'vertical_oscillation', 'vertical_ratio', 'ground_contact', 'ground_contact_percent', 'ground_contact_balance',
    'step_length',
  ]
  // averages of the running dynamics, absent ones are 0 or missing
  const running = computed(() => activity.value?.metrics?.running ?? null)
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
  // the activities of the route, this one included, loaded by the same route list
  const routeActivities = ref<SimilarActivity[]>([])
  watch(() => route.params.id, () => {
    routeActivities.value = []
  })
  // a triathlon...: one activity made of the sessions of the FIT file
  const hasLegs = computed(() => (activity.value?.legs?.length ?? 0) > 1)
  // the time in heart rate zones, of the activities with a heart rate (zeros without)
  const hasHrZones = computed(() => (activity.value?.hr_zones ?? []).some((s: number) => s > 0))
  const hasPowerZones = computed(() => (activity.value?.power_zones ?? []).some((s: number) => s > 0))
  // what the training load is
  const scoreSources: Record<string, string> = {
    device: 'Recorded by the device',
    power: 'TSS of the power',
    hr: 'TRIMP of the heart rate',
  }
  // the fastest stretches and best powers, of the activities long enough for the shortest one
  const hasBestEfforts = computed(() => (activity.value?.best_efforts?.length ?? 0) > 0)
  const hasPowerCurve = computed(() => (activity.value?.power_curve?.length ?? 0) > 1)
  // the speed per km, of the activities with a distance
  const hasMeans = computed(() => (activity.value?.means ?? []).some((m: number) => m > 0))
  // the owner gets the whole trace; the public trace, without the privacy zones, is empty for a short loop
  const hasMap = computed(() => !!(activity.value?.gps_points?.length || activity.value?.public_gps_points?.length))
  // the same route list is as high as the map next to it, and scrolls
  const mapHeight = '60vh'

  const router = useRouter()
  const activitiesStore = useActivitiesStore()
  const deleting = ref(false)
  const deleteError = ref('')
  const deleteActivity = async () => {
    deleteError.value = ''
    deleting.value = true
    try {
      // the store asks for a confirmation
      if (await activitiesStore.deleteActivity(activity.value.id)) {
        await router.push('/activities')
      }
    } catch {
      deleteError.value = 'The activity could not be deleted.'
    } finally {
      deleting.value = false
    }
  }

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
      <div class="d-flex align-center mb-2">
        <h5 class="text-h5">{{ activity.title }}</h5>
        <v-spacer />
        <template v-if="isOwner">
          <v-btn
            class="mr-2"
            :disabled="deleting"
            :prepend-icon="mdiPencilOutline"
            :to="`/activity/${activity.id}/edit`"
            variant="tonal"
          >
            Edit
          </v-btn>
          <v-btn
            color="error"
            :loading="deleting"
            :prepend-icon="mdiDeleteOutline"
            variant="tonal"
            @click="deleteActivity"
          >
            Delete
          </v-btn>
        </template>
      </div>
      <v-alert
        v-if="deleteError"
        class="mb-2"
        closable
        density="compact"
        type="error"
        @click:close="deleteError = ''"
      >
        {{ deleteError }}
      </v-alert>
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
            {{ activity.device_label || activity.device_name }}
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
          <v-card-subtitle class="pt-2">Average {{ usesPace(activity.sport) ? 'pace' : 'speed' }}</v-card-subtitle>
          <v-card-text class="text-h6 pt-1">{{ formatSpeedFor(activity.sport, activity.avg_speed) }}</v-card-text>
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
        <v-card v-if="activity.normalized_power" density="compact">
          <v-card-subtitle class="pt-2">Normalized power</v-card-subtitle>
          <v-card-text class="text-h6 pt-1">{{ Math.round(activity.normalized_power) }} W</v-card-text>
        </v-card>
        <v-card v-if="activity.intensity" density="compact" :title="`At an FTP of ${activity.ftp} W`">
          <v-card-subtitle class="pt-2">Intensity factor</v-card-subtitle>
          <v-card-text class="text-h6 pt-1">{{ activity.intensity.toFixed(2) }}</v-card-text>
        </v-card>
        <v-card v-if="activity.tss" density="compact">
          <v-card-subtitle class="pt-2">TSS</v-card-subtitle>
          <v-card-text class="text-h6 pt-1">{{ Math.round(activity.tss) }}</v-card-text>
        </v-card>
        <v-card v-if="activity.trimp > 0" density="compact" :title="scoreSources[activity.score_source] ?? ''">
          <v-card-subtitle class="pt-2">Training load</v-card-subtitle>
          <v-card-text class="text-h6 pt-1">{{ Math.round(activity.trimp) }}</v-card-text>
        </v-card>
        <template v-if="running">
          <v-card v-if="running.avg_vertical_oscillation > 0" density="compact">
            <v-card-subtitle class="pt-2">Vertical oscillation</v-card-subtitle>
            <v-card-text class="text-h6 pt-1">{{ (running.avg_vertical_oscillation / 10).toFixed(1) }} cm</v-card-text>
          </v-card>
          <v-card v-if="running.avg_vertical_ratio > 0" density="compact">
            <v-card-subtitle class="pt-2">Vertical ratio</v-card-subtitle>
            <v-card-text class="text-h6 pt-1">{{ running.avg_vertical_ratio.toFixed(1) }} %</v-card-text>
          </v-card>
          <v-card v-if="running.avg_stance_time > 0" density="compact">
            <v-card-subtitle class="pt-2">Ground contact time</v-card-subtitle>
            <v-card-text class="text-h6 pt-1">{{ Math.round(running.avg_stance_time) }} ms</v-card-text>
          </v-card>
          <v-card v-if="running.avg_stance_time_balance > 0" density="compact">
            <v-card-subtitle class="pt-2">Ground contact balance</v-card-subtitle>
            <v-card-text class="text-h6 pt-1">
              {{ running.avg_stance_time_balance.toFixed(1) }} % L / {{ (100 - running.avg_stance_time_balance).toFixed(1) }} % R
            </v-card-text>
          </v-card>
          <v-card v-if="running.avg_step_length > 0" density="compact">
            <v-card-subtitle class="pt-2">Step length</v-card-subtitle>
            <v-card-text class="text-h6 pt-1">{{ (running.avg_step_length / 1000).toFixed(2) }} m</v-card-text>
          </v-card>
        </template>
        <v-card v-if="activity.is_commute" density="compact">
          <v-card-subtitle class="pt-2">CO2</v-card-subtitle>
          <v-card-text class="text-h6 pt-1">{{ (activity.co2 / 1000).toFixed(1) }} kg</v-card-text>
        </v-card>
      </div>
      <!-- the weather at the start, once the backend got it -->
      <v-row v-if="activity.weather && !activity.weather.unavailable">
        <v-col cols="12">
          <ActivityWeather :weather="activity.weather" />
        </v-col>
      </v-row>
      <!-- what it achieved, for its owner: hidden when nothing -->
      <v-row v-if="isOwner">
        <v-col cols="12">
          <ActivityHighlights :key="activity.id" :activity-id="activity.id" />
        </v-col>
      </v-row>
      <v-row v-if="hasLegs">
        <v-col cols="12">
          <MultisportLegs :legs="activity.legs" />
        </v-col>
      </v-row>
      <v-row v-if="hasHrZones || hasPowerZones">
        <v-col v-if="hasPowerZones" cols="12" :lg="hasHrZones ? 6 : 12">
          <ActivityPowerZones :bounds="activity.power_zone_bounds" :ftp="activity.ftp" :zones="activity.power_zones" />
        </v-col>
        <v-col v-if="hasHrZones" cols="12" :lg="hasPowerZones ? 6 : 12">
          <ActivityHrZones :bounds="activity.hr_zone_bounds" :zones="activity.hr_zones" />
        </v-col>
      </v-row>
      <v-row v-if="hasPowerCurve">
        <v-col cols="12">
          <ActivityPowerCurve
            :curve="activity.power_curve"
            :date="activity.date"
            :owner="isOwner"
            :sport="activity.sport"
          />
        </v-col>
      </v-row>
      <v-row v-if="hasBestEfforts">
        <v-col cols="12">
          <ActivityBestEfforts
            :activity-id="activity.id"
            :date="activity.date"
            :efforts="activity.best_efforts"
            :owner="isOwner"
          />
        </v-col>
      </v-row>
      <!-- the passes on the segments of the owner, who creates them from the full trace -->
      <v-row v-if="isOwner && (activity.gps_points?.length ?? 0) > 1">
        <v-col cols="12">
          <ActivitySegments
            :key="activity.id"
            :activity-id="activity.id"
            :points="activity.gps_points ?? []"
            :stamps="activity.gps_time_stamps ?? []"
          />
        </v-col>
      </v-row>
      <!-- the map and the activities on the same route side by side, stacked on small screens -->
      <v-row v-if="hasMap || showSimilar">
        <v-col v-if="hasMap" cols="12" :md="showSimilar ? 8 : 12">
          <Map :activity="activity" :height="mapHeight" />
        </v-col>
        <v-col v-if="showSimilar" cols="12" :md="hasMap ? 4 : 12">
          <div class="similar" :style="hasMap ? { height: mapHeight } : undefined">
            <SimilarActivities
              :key="activity.id"
              :activity="activity"
              @commute="onRouteCommute"
              @loaded="routeActivities = $event"
            />
          </div>
        </v-col>
      </v-row>
      <!-- the average speed of every activity on the route, once there are two to compare -->
      <v-row v-if="showSimilar && routeActivities.length > 1">
        <v-col cols="12">
          <RouteProgress :activities="routeActivities" :current="activity.id" :sport="activity.sport" />
        </v-col>
      </v-row>
      <!-- the graphs below, the whole width -->
      <v-row>
        <v-col cols="12">
          <v-card>
            <template v-if="hasLegs || activity.sport !== 'swimming'">
              <Graph-line v-for="graph in graphs" :key="graph" :activity="activity" :graph="graph" />
              <template v-if="running">
                <Graph-line v-for="graph in graphsRunning" :key="graph" :activity="activity" :graph="graph" />
              </template>
              <Graph-bar v-if="hasMeans" :activity="activity" :graph="means" />
            </template>
            <template v-if="activity.sport === 'swimming'">
              <Graph-line v-for="graph in graphsSwimming" :key="graph" :activity="activity" :graph="graph" />
            </template>
          </v-card>
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

.similar
  overflow-y: auto
</style>
