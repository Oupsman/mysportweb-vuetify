<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { mdiBriefcaseOutline, mdiCheck } from '@mdi/js'
  import { useActivitiesStore } from '@/stores/activities'
  import { useAppStore } from '@/stores/app'
  import type { DuplicateActivity, DuplicateGroup } from '@/types/activities'
  import { formatDate, formatDistance, formatDuration, formatSpeed, sportColor, sportIcon } from '@/utils/format'

  const activitiesStore = useActivitiesStore()
  const appStore = useAppStore()

  const groups = ref<DuplicateGroup[]>([])
  const isLoading = ref(true)
  const error = ref('')
  // ids of the activities being deleted
  const deleting = ref(new Set<string>())
  const progress = ref<{ done: number, total: number } | null>(null)

  const load = async () => {
    isLoading.value = true
    error.value = ''
    try {
      groups.value = await activitiesStore.findDuplicates()
    } catch {
      error.value = 'The duplicates could not be loaded'
    } finally {
      isLoading.value = false
    }
  }
  onMounted(load)

  const identicalGroups = computed(() => groups.value.filter(g => g.identical))
  const extraCopies = computed(() => identicalGroups.value.reduce((n, g) => n + g.activities.length - 1, 0))

  // the copy to keep: the one the user worked on (commute, equipment), else the first imported
  const suggested = (group: DuplicateGroup): DuplicateActivity =>
    group.activities.find(a => a.is_commute) ??
    group.activities.find(a => a.equipment_id) ??
    group.activities[0]

  const formatTime = (date: string) => new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(new Date(date))

  // deletes the activities of group but keep, returns the number of failures
  const resolve = async (group: DuplicateGroup, keep: DuplicateActivity): Promise<number> => {
    let failed = 0
    for (const a of group.activities.filter(a => a.id !== keep.id)) {
      deleting.value.add(a.id)
      try {
        await activitiesStore.deleteActivity(a.id, false)
        group.activities = group.activities.filter(other => other.id !== a.id)
      } catch {
        failed++
      } finally {
        deleting.value.delete(a.id)
        if (progress.value) {
          progress.value.done++
        }
      }
    }
    if (group.activities.length < 2) {
      groups.value = groups.value.filter(g => g !== group)
    }
    return failed
  }

  const keepOne = async (group: DuplicateGroup, keep: DuplicateActivity) => {
    const others = group.activities.length - 1
    if (!confirm(`Keep "${keep.title}" and delete the ${others} other ${others > 1 ? 'copies' : 'copy'}?`)) {
      return
    }
    error.value = ''
    if (await resolve(group, keep) > 0) {
      error.value = 'Some activities could not be deleted'
    }
  }

  const resolveIdentical = async () => {
    if (!confirm(`Delete ${extraCopies.value} identical copies? In each group, the copy marked "Suggested" is kept.`)) {
      return
    }
    error.value = ''
    progress.value = { done: 0, total: extraCopies.value }
    let failed = 0
    for (const group of [...identicalGroups.value]) {
      failed += await resolve(group, suggested(group))
    }
    progress.value = null
    if (failed > 0) {
      error.value = `${failed} activities could not be deleted`
    }
  }

  const open = (id: string) => appStore.navigateToPage(`/activity/${id}`)
</script>

<template>
  <div>
    <div v-if="isLoading">Looking for duplicates...</div>
    <template v-else>
      <v-alert
        v-if="error"
        class="mb-4"
        closable
        type="error"
        @click:close="error = ''"
      >{{ error }}</v-alert>

      <v-card v-if="groups.length === 0 && !error" class="pa-8 text-center">
        <v-icon class="mb-2" color="success" :icon="mdiCheck" size="large" />
        <div class="text-h6">No duplicates</div>
      </v-card>

      <template v-else>
        <div class="d-flex flex-wrap align-center ga-2 mb-4">
          <span>
            {{ groups.length }} groups: {{ identicalGroups.length }} with identical copies,
            {{ groups.length - identicalGroups.length }} possible duplicates
          </span>
          <v-spacer />
          <v-btn
            v-if="extraCopies > 0"
            color="error"
            :disabled="progress !== null"
            variant="tonal"
            @click="resolveIdentical"
          >
            Delete {{ extraCopies }} identical copies
          </v-btn>
        </div>
        <v-progress-linear
          v-if="progress"
          class="mb-4"
          color="error"
          height="6"
          :model-value="(progress.done / progress.total) * 100"
        />

        <v-card v-for="group in groups" :key="group.activities[0].id" class="mb-3">
          <v-card-item>
            <v-card-title class="text-subtitle-1">{{ formatDate(group.activities[0].date) }}</v-card-title>
            <template #append>
              <v-chip v-if="group.identical" color="error" size="small" variant="tonal">Identical copies</v-chip>
              <v-chip v-else color="warning" size="small" variant="tonal">Possible duplicate</v-chip>
            </template>
            <v-card-subtitle v-if="!group.identical">
              Same sport at the same time, check before deleting: it may be two devices recording one activity
            </v-card-subtitle>
          </v-card-item>
          <v-table density="compact">
            <thead>
              <tr>
                <th />
                <th>Start</th>
                <th>Title</th>
                <th class="text-right">Distance</th>
                <th class="text-right">Time</th>
                <!-- phones: only start, title, distance and time -->
                <th class="text-right d-none d-sm-table-cell">Speed</th>
                <th class="d-none d-md-table-cell">Equipment</th>
                <th class="d-none d-md-table-cell">Imported</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in group.activities" :key="a.id">
                <td><v-icon :color="sportColor(a.sport)" :icon="sportIcon(a.sport)" size="small" /></td>
                <td class="text-no-wrap">{{ formatTime(a.date) }}</td>
                <td>
                  <a class="cursor-pointer text-decoration-underline" @click="open(a.id)">{{ a.title }}</a>
                  <v-icon
                    v-if="a.is_commute"
                    class="ml-1"
                    :icon="mdiBriefcaseOutline"
                    size="x-small"
                    title="Commute"
                  />
                  <v-chip
                    v-if="group.identical && suggested(group).id === a.id"
                    class="ml-1"
                    color="success"
                    size="x-small"
                  >
                    Suggested
                  </v-chip>
                </td>
                <td class="text-right text-no-wrap">{{ formatDistance(a.distance) }}</td>
                <td class="text-right text-no-wrap">{{ formatDuration(a.duration) }}</td>
                <td class="text-right text-no-wrap d-none d-sm-table-cell">{{ formatSpeed(a.avg_speed) }}</td>
                <td class="d-none d-md-table-cell">{{ a.equipment_name ?? '' }}</td>
                <td class="text-no-wrap d-none d-md-table-cell">{{ formatDate(a.imported_at) }}</td>
                <td class="text-right">
                  <v-btn
                    :disabled="progress !== null || deleting.size > 0"
                    :loading="deleting.has(a.id)"
                    size="small"
                    variant="text"
                    @click="keepOne(group, a)"
                  >
                    Keep this one
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </template>
    </template>
  </div>
</template>
