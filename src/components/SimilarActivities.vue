<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import type { PropType } from 'vue'
  import { useActivitiesStore } from '@/stores/activities'
  import { useAppStore } from '@/stores/app'
  import type { Activity, SimilarActivity } from '@/types/activities'

  const props = defineProps({
    activity: {
      type: Object as PropType<Activity>,
      required: true,
    },
  })

  const activitiesStore = useActivitiesStore()
  const appStore = useAppStore()
  const others = ref<SimilarActivity[]>([])
  const isLoading = ref(true)
  const error = ref('')

  onMounted(async () => {
    try {
      others.value = await activitiesStore.getSimilarActivities(props.activity.id)
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
      <div v-else-if="others.length === 0">This is the only activity on this route for now.</div>
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
