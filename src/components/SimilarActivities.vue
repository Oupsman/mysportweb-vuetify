<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import type { PropType } from 'vue'
  import { useActivitiesStore } from '@/stores/activities'
  import { useAppStore } from '@/stores/app'
  import type { Activity, Route, SimilarActivity } from '@/types/activities'

  const props = defineProps({
    activity: {
      type: Object as PropType<Activity>,
      required: true,
    },
  })

  const emit = defineEmits<{
    // the commute flag of the route's activities, this one included, changed
    commute: [isCommute: boolean]
  }>()

  const activitiesStore = useActivitiesStore()
  const appStore = useAppStore()
  const others = ref<SimilarActivity[]>([])
  const route = ref<Route | null>(null)
  const isLoading = ref(true)
  const error = ref('')

  onMounted(async () => {
    try {
      const similar = await activitiesStore.getSimilarActivities(props.activity.id)
      others.value = similar.activities
      route.value = similar.route
    } catch {
      error.value = 'The activities on this route could not be loaded'
    } finally {
      isLoading.value = false
    }
  })

  // this activity and the others on the route, most recent first
  const rows = computed((): SimilarActivity[] => [props.activity, ...others.value]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))

  // distances may differ by up to 10%, average speed compares them fairly
  const fastestID = computed(() => rows.value.reduce((best, a) => a.avg_speed > best.avg_speed ? a : best).id)

  const formatDate = (date: string) => new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date(date))

  const formatDuration = (seconds: number) => [
    Math.floor(seconds / 3600),
    Math.floor((seconds % 3600) / 60),
    seconds % 60,
  ].map(n => String(n).padStart(2, '0')).join(':')

  const isSaving = ref(false)
  const commuteError = ref('')
  const nbActivities = computed(() => others.value.length + 1)

  // it overwrites the commute flag set on each activity of the route
  const setCommute = async (isCommute: boolean | null) => {
    if (!route.value || isCommute === null) {
      return
    }
    const question = isCommute
      ? `Mark the ${nbActivities.value} activities of this route, and the ones imported later, as commutes?`
      : `Unmark the ${nbActivities.value} activities of this route as commutes?`
    if (!confirm(question)) {
      return
    }
    isSaving.value = true
    commuteError.value = ''
    try {
      await activitiesStore.setRouteCommute(route.value.id, isCommute)
      route.value.is_commute = isCommute
      emit('commute', isCommute)
    } catch {
      commuteError.value = 'The route could not be updated'
    } finally {
      isSaving.value = false
    }
  }

  const open = (id: string) => {
    if (id !== props.activity.id) {
      appStore.navigateToPage(`/activity/${id}`)
    }
  }
</script>

<template>
  <v-card class="w-100">
    <v-card-title>Same route</v-card-title>
    <v-card-text>
      <div v-if="isLoading">Loading...</div>
      <v-alert v-else-if="error" type="error">{{ error }}</v-alert>
      <template v-else>
        <v-switch
          v-if="route"
          color="primary"
          density="compact"
          :disabled="isSaving"
          hide-details
          :loading="isSaving"
          :model-value="route.is_commute"
          @update:model-value="setCommute"
        >
          <template #label>
            <div>
              Commute route
              <div class="text-caption text-medium-emphasis">
                Its activities, and the next ones on this route, are commutes
              </div>
            </div>
          </template>
        </v-switch>
        <v-alert v-if="commuteError" class="mb-2" density="compact" type="error">{{ commuteError }}</v-alert>
        <div v-if="others.length === 0">This is the only activity on this route for now.</div>
        <v-table v-else class="similar-table" density="compact" hover>
          <thead>
            <tr>
              <th>Date</th>
              <th class="text-right">Distance</th>
              <th class="text-right">Duration</th>
              <th class="text-right">Speed</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in rows"
              :key="row.id"
              :class="row.id === props.activity.id ? 'font-weight-bold' : 'cursor-pointer'"
              @click="open(row.id)"
            >
              <!-- the list takes a third of the page: the title goes under the date -->
              <td class="py-1">
                <div class="text-no-wrap">{{ formatDate(row.date) }}</div>
                <div class="text-caption text-medium-emphasis">
                  {{ row.id === props.activity.id ? 'This activity' : row.title }}
                  <v-chip v-if="row.id === fastestID" class="ml-1" color="primary" size="x-small">Fastest</v-chip>
                </div>
              </td>
              <td class="text-right text-no-wrap">{{ (row.distance / 1000).toFixed(2) }} km</td>
              <td class="text-right">{{ formatDuration(row.duration) }}</td>
              <td class="text-right text-no-wrap">{{ (row.avg_speed * 3.6).toFixed(1) }} km/h</td>
            </tr>
          </tbody>
        </v-table>
      </template>
    </v-card-text>
  </v-card>
</template>

<style scoped>
/* the list takes a third of the page: narrower cells than Vuetify's 16px padding */
.similar-table :deep(th),
.similar-table :deep(td) {
  padding: 0 6px !important;
}
</style>
