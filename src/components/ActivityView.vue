<script setup lang="ts">
  import { computed, onMounted, provide, ref, shallowRef, watch } from 'vue'
  import { useAppStore } from '@/stores/app'
  import { useUserStore } from '@/stores/user'
  import { useRoute } from 'vue-router'
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
  const panel = ref(0)
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
    <v-container>
      <v-row>
        <h5 class="text-h5"> {{ activity.title }}</h5>
      </v-row>
      <v-row>
        <v-sheet class="d-flex flex-wrap">
          <v-card class="h-auto w-20 ma-2">
            <v-card-title> Sport:</v-card-title>
            <v-card-text> {{ sportLabel(activity.sport) }}</v-card-text>
          </v-card>
          <v-card class="h-auto w-20 ma-2">
            <v-card-title> Date: </v-card-title>
            <v-card-text> {{ formattedActivityDate }}</v-card-text>
          </v-card>
          <!-- hidden when the FIT file doesn't tell the device (an activity entered by hand) -->
          <v-card v-if="activity.device_name" class="h-auto w-20 ma-2">
            <v-card-title> Device: </v-card-title>
            <v-card-text>
              {{ activity.device_name }}
              <div v-if="activity.device?.software" class="text-caption text-medium-emphasis">
                firmware {{ activity.device.software }}
              </div>
            </v-card-text>
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
      <v-row v-if="hasLegs">
        <v-col cols="12">
          <MultisportLegs :legs="activity.legs" />
        </v-col>
      </v-row>
      <v-row>
        <Map v-if="activity.public_gps_points !== null " :activity="activity" />
      </v-row>
      <!-- graphs on the left, activities on the same route on the right third; stacked on small screens -->
      <v-row>
        <v-col cols="12" :md="showSimilar ? 8 : 12">
          <v-expansion-panels v-model="panel" accordion>
            <v-expansion-panel v-if="hasLegs || activity.sport !== 'swimming'">
              <Graph-line
                v-for="graph in graphs"
                :key="graph"
                :activity="activity"
                :graph="graph"
                style="height: 200px;  "
              />
              <Graph-bar v-if="hasMeans" :activity="activity" :graph="means" />
            </v-expansion-panel>
            <v-expansion-panel
              v-if="activity.sport === 'swimming'"
            >
              <Graph-line v-for="graph in graphsSwimming" :key="graph" :activity="activity" :graph="graph" />
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
        <v-col v-if="showSimilar" cols="12" md="4">
          <SimilarActivities :activity="activity" @commute="onRouteCommute" />
        </v-col>
      </v-row>
    </v-container>
  </div>
  <div v-else>Activité non trouvée</div>
</template>

<style scoped lang="sass">

</style>
