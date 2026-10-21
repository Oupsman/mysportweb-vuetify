<script setup lang="ts">
  import { useActivitiesStore } from '@/stores/activities'
  import { useAppStore } from '@/stores/app'
  import { useEquipmentsStore } from '@/stores/equipments'

  import { onMounted, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import type { Activity } from '@/types/activities'

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
    <v-container>
      <h2>Activity Edit</h2>
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
    </v-container>
  </div>
  <div v-else>Activité non trouvée</div>
</template>

<style scoped lang="sass">

</style>
