<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { mdiBullseyeArrow, mdiDelete, mdiPencil, mdiPlus } from '@mdi/js'
  import GoalCard from '@/components/GoalCard.vue'
  import GoalForm from '@/components/GoalForm.vue'
  import { useGoalsStore } from '@/stores/goals'
  import type { Goal } from '@/types/goals'
  import { goalTitle } from '@/utils/goals'

  const goalsStore = useGoalsStore()
  const loading = ref(true)
  const error = ref('')
  onMounted(async () => {
    try {
      await goalsStore.load()
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  })

  // the goals in progress first, the custom ones ended last
  const sorted = computed(() => [...goalsStore.goals].sort((a, b) =>
    Number(a.state === 'missed' || (a.period === 'custom' && a.days_left === 0)) -
    Number(b.state === 'missed' || (b.period === 'custom' && b.days_left === 0))))

  const dialog = ref(false)
  const editing = ref<Goal | null>(null)
  // a key per opening: the form starts again from the goal
  const formKey = ref(0)
  const open = (goal: Goal | null) => {
    editing.value = goal
    formKey.value++
    dialog.value = true
  }

  const deleting = ref<Goal | null>(null)
  const deleteError = ref('')
  const busy = ref(false)
  const confirmDelete = async () => {
    if (!deleting.value) {
      return
    }
    busy.value = true
    deleteError.value = ''
    try {
      await goalsStore.remove(deleting.value.id)
      deleting.value = null
    } catch (e) {
      deleteError.value = (e as Error).message
    } finally {
      busy.value = false
    }
  }
</script>

<template>
  <v-container>
    <div class="d-flex align-center mb-4">
      <h2 class="text-h4">Goals</h2>
      <v-spacer />
      <v-btn color="primary" :prepend-icon="mdiPlus" @click="open(null)">New goal</v-btn>
    </div>
    <v-alert v-if="error" class="mb-4" type="error">{{ error }}</v-alert>
    <v-progress-linear v-if="loading" indeterminate />

    <v-card v-else-if="!goalsStore.goals.length && !error" class="pa-8 text-center">
      <v-icon class="mb-2" color="primary" :icon="mdiBullseyeArrow" size="48" />
      <v-card-title class="text-h5">No goal yet</v-card-title>
      <v-card-text>
        Set a target of distance, time, elevation or activities, every week, month or year or between two dates:
        you see where you stand against a steady pace, and get notified when you reach it.
      </v-card-text>
      <v-btn color="primary" :prepend-icon="mdiPlus" @click="open(null)">Set a goal</v-btn>
    </v-card>

    <v-row v-else>
      <v-col v-for="goal in sorted" :key="goal.id" cols="12" md="6">
        <v-card class="pa-4 h-100">
          <GoalCard :goal="goal">
            <template #actions>
              <v-btn
                aria-label="Edit"
                density="comfortable"
                :icon="mdiPencil"
                size="small"
                variant="text"
                @click="open(goal)"
              />
              <v-btn
                aria-label="Delete"
                density="comfortable"
                :icon="mdiDelete"
                size="small"
                variant="text"
                @click="deleting = goal; deleteError = ''"
              />
            </template>
          </GoalCard>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="dialog" max-width="560">
      <GoalForm :key="formKey" :goal="editing" @cancel="dialog = false" @saved="dialog = false" />
    </v-dialog>

    <v-dialog max-width="420" :model-value="deleting !== null" :persistent="busy" @update:model-value="deleting = null">
      <v-card :title="`Delete ${deleting ? goalTitle(deleting) : ''}?`">
        <v-card-text>
          <v-alert v-if="deleteError" class="mb-2" type="error">{{ deleteError }}</v-alert>
          Your activities are kept: only the goal goes.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn :disabled="busy" @click="deleting = null">Cancel</v-btn>
          <v-btn color="error" :loading="busy" variant="flat" @click="confirmDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
