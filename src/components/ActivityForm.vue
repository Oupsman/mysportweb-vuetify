<script setup lang="ts">
  import { useActivitiesStore } from '@/stores/activities'
  import { useAppStore } from '@/stores/app'
  import { useEquipmentsStore } from '@/stores/equipments'

  import { computed, onMounted, provide, ref, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import type { Activity } from '@/types/activities'
  import { activityCursorKey, nearestIndex } from '@/composables/activityCursor'
  import { formatDistance } from '@/utils/format'

  const activity = ref<Activity | null>(null)
  const isLoading = ref(true)

  const visibilities = [
    { value: 0, desc: 'Private' },
    { value: 1, desc: 'Friends only' },
    { value: 2, desc: 'Public' },
  ]

  // forms fields
  const title = ref('')
  const commute = ref(false)
  const canComments = ref(false)
  const visibility = ref(0)
  const equipmentID = ref<string | null>(null)

  const route = useRoute('/activity/[id]/edit')

  const activitiesStore = useActivitiesStore()
  const appStore = useAppStore()
  const equipmentsStore = useEquipmentsStore()

  const fetchActivity = async () => {
    try {
      isLoading.value = true
      activity.value = await activitiesStore.getActivity(route.params.id)
      title.value = activity.value.title
      commute.value = activity.value.is_commute
      canComments.value = activity.value.can_comments
      visibility.value = activity.value.visibility
      equipmentID.value = activity.value.equipment_id
      trimEnd.value = activity.value.trim_end || recordedDuration.value
      // the map reads the trace once: a new one after trimming needs a new map
      mapKey.value++

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

  // trimming: what was recorded after trimEnd seconds since the start is ignored, the FIT file is kept
  const minDuration = 60 // TrimMinDuration of the backend
  const trimEnd = ref(0)
  const trimming = ref(false)
  const trimError = ref('')
  const trimDone = ref('')
  const mapKey = ref(0)
  const offsets = computed(() => (activity.value?.time_stamps ?? []).map(s => Number.parseFloat(s)))
  // the activities imported before the whole duration was stored aren't trimmed: their records cover it
  const recordedDuration = computed(() => {
    if (!activity.value) return 0
    if (activity.value.recorded_duration > 0) return Math.floor(activity.value.recorded_duration)
    const last = offsets.value.at(-1)
    return Math.floor(last ?? activity.value.duration)
  })
  const isTrimmed = computed(() => (activity.value?.trim_end ?? 0) > 0)
  const currentEnd = computed(() => isTrimmed.value ? activity.value!.trim_end : recordedDuration.value)
  const canTrim = computed(() => recordedDuration.value > minDuration && Math.abs(trimEnd.value - currentEnd.value) >= 1)
  const hasMap = computed(() => (activity.value?.gps_points?.length ?? 0) > 0)

  const clock = (offset: number): string => {
    if (!activity.value) return ''
    return new Date(new Date(activity.value.date).getTime() + offset * 1000)
      .toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }
  const elapsed = (seconds: number): string => {
    const s = Math.round(seconds)
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    return `${h}:${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  }
  // the distance at the end chosen, unknown after the current end of a trimmed activity
  const distanceAtEnd = computed((): number | null => {
    const distances = activity.value?.dist_array ?? []
    if (distances.length === 0 || distances.length !== offsets.value.length || trimEnd.value > currentEnd.value) {
      return null
    }
    const index = nearestIndex(offsets.value, trimEnd.value, o => o)
    return index < 0 ? null : distances[index]
  })

  // the map shows where the activity would end
  const cursor = ref<number | null>(null)
  provide(activityCursorKey, cursor)
  watch(trimEnd, end => {
    cursor.value = activity.value ? new Date(activity.value.date).getTime() + end * 1000 : null
  })

  const trim = async (end: number) => {
    trimError.value = ''
    trimDone.value = ''
    trimming.value = true
    try {
      await activitiesStore.trimActivity(route.params.id, end)
      await fetchActivity()
      trimDone.value = end > 0 && isTrimmed.value
        ? `The activity now ends ${elapsed(end)} after the start.`
        : 'The whole recording is back.'
    } catch (e: any) {
      trimError.value = `The activity could not be trimmed: ${e?.message ?? e}`
    } finally {
      trimming.value = false
    }
  }
  // the end of the recording is no trimming
  const applyTrim = () => trim(trimEnd.value >= recordedDuration.value ? 0 : trimEnd.value)

  const error = ref('')
  const save = async () => {
    error.value = ''
    try {
      await activitiesStore.saveActivity({
        id: route.params.id,
        title: title.value,
        can_comments: canComments.value,
        visibility: visibility.value,
        is_commute: commute.value,
        equipment_id: equipmentID.value ?? null,
      })
      appStore.navigateToPage(`/activity/${route.params.id}`)
    } catch {
      error.value = 'The activity could not be saved'
    }
  }
</script>

<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="activity">
    <h2 class="mb-4">Activity Edit</h2>
    <v-card class="mb-4">
      <v-card-text>
        <v-alert v-if="error" class="mb-4" type="error">{{ error }}</v-alert>
        <v-form @submit.prevent="save">
          <v-text-field
            v-model="title"
            autofocus
            label="Title"
            type="text"
          />
          <v-select
            v-model="visibility"
            item-title="desc"
            item-value="value"
            :items="visibilities"
            label="Visibility"
          />
          <v-select
            v-model="equipmentID"
            clearable
            item-title="name"
            item-value="id"
            :items="equipmentsStore.equipments"
            label="Equipment"
          />
          <v-row>
            <v-checkbox
              v-model="commute"
              label="Commute"
            />
            <v-checkbox
              v-model="canComments"
              label="Comments allowed"
            />
          </v-row>
          <v-btn color="primary" type="submit">Save</v-btn>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- the device wasn't stopped at the end: cut what was recorded after -->
    <v-card v-if="recordedDuration > minDuration">
      <v-card-title>Trim the end</v-card-title>
      <v-card-text>
        <p class="mb-4 text-medium-emphasis">
          Forgot to stop your device? Choose where the activity really ended: what was recorded after is
          ignored and the statistics are computed again. The original file is kept, the whole recording can be
          restored.
        </p>
        <v-alert
          v-if="trimError"
          class="mb-4"
          closable
          type="error"
          @click:close="trimError = ''"
        >{{ trimError }}</v-alert>
        <v-alert
          v-if="trimDone"
          class="mb-4"
          closable
          type="success"
          @click:close="trimDone = ''"
        >{{ trimDone }}</v-alert>
        <v-slider
          v-model="trimEnd"
          color="error"
          :disabled="trimming"
          hide-details
          :max="recordedDuration"
          :min="minDuration"
          :step="1"
        />
        <div class="d-flex flex-wrap ga-4 my-2">
          <div><span class="text-medium-emphasis">Ends after</span> <strong>{{ elapsed(trimEnd) }}</strong></div>
          <div><span class="text-medium-emphasis">at</span> <strong>{{ clock(trimEnd) }}</strong></div>
          <div v-if="distanceAtEnd !== null">
            <span class="text-medium-emphasis">Distance</span> <strong>{{ formatDistance(distanceAtEnd) }}</strong>
          </div>
          <div class="text-medium-emphasis">
            Recording: {{ elapsed(recordedDuration) }}<template v-if="isTrimmed">, currently trimmed at {{ elapsed(activity.trim_end) }}</template>
          </div>
        </div>
        <!-- the green dot is the end chosen; after the current end of a trimmed activity, there is no trace -->
        <Map
          v-if="hasMap"
          :key="mapKey"
          :activity="activity"
          class="mb-4"
          height="400px"
        />
        <v-btn
          class="mr-2"
          color="error"
          :disabled="!canTrim"
          :loading="trimming"
          @click="applyTrim"
        >
          Trim
        </v-btn>
        <v-btn
          v-if="isTrimmed"
          :disabled="trimming"
          variant="tonal"
          @click="trim(0)"
        >
          Restore the whole recording
        </v-btn>
      </v-card-text>
    </v-card>
  </div>
  <div v-else>Activité non trouvée</div>
</template>

<style scoped lang="sass">

</style>
