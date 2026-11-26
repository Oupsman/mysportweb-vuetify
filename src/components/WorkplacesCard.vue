<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { mdiBriefcaseOutline, mdiDelete, mdiHistory, mdiPencil, mdiPlus } from '@mdi/js'
  import WorkplaceForm from '@/components/WorkplaceForm.vue'
  import { useWorkplacesStore } from '@/stores/workplaces'
  import type { Workplace } from '@/types/workplaces'

  const workplacesStore = useWorkplacesStore()
  const loading = ref(true)
  const error = ref('')
  const message = ref('')
  onMounted(async () => {
    try {
      await workplacesStore.load()
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  })

  const dialog = ref(false)
  const editing = ref<Workplace | null>(null)
  // a key per opening: the form starts again from the workplace
  const formKey = ref(0)
  const open = (workplace: Workplace | null) => {
    editing.value = workplace
    formKey.value++
    dialog.value = true
  }

  const applying = ref<string | null>(null)
  const applyToPast = async (workplace: Workplace) => {
    applying.value = workplace.id
    error.value = ''
    message.value = ''
    try {
      const updated = await workplacesStore.applyToPast(workplace.id)
      message.value = updated
        ? `${updated} ${updated > 1 ? 'activities are' : 'activity is'} now ${updated > 1 ? 'commutes' : 'a commute'}.`
        : 'No other activity starts or ends there.'
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      applying.value = null
    }
  }

  // the new commutes are marked at their import, the ones already recorded only if the user wants
  const saved = async (workplace: Workplace, created: boolean) => {
    dialog.value = false
    if (created && confirm('Also mark the activities you already recorded that start or end there as commutes?')) {
      await applyToPast(workplace)
    }
  }

  const remove = async (workplace: Workplace) => {
    if (!confirm(`Delete "${workplace.name || 'this workplace'}"? Its activities stay commutes.`)) {
      return
    }
    error.value = ''
    try {
      await workplacesStore.remove(workplace.id)
    } catch (e) {
      error.value = (e as Error).message
    }
  }

  const diameterLabel = (diameter: number) => diameter >= 1000 ? `${diameter / 1000} km` : `${diameter} m`
</script>

<template>
  <v-card>
    <v-card-item :prepend-icon="mdiBriefcaseOutline">
      <v-card-title>Workplaces</v-card-title>
      <v-card-subtitle>The activities starting or ending at one are commutes</v-card-subtitle>
      <template #append>
        <v-btn color="primary" :prepend-icon="mdiPlus" variant="text" @click="open(null)">Add</v-btn>
      </template>
    </v-card-item>
    <v-card-text>
      <v-alert v-if="error" class="mb-2" type="error" variant="tonal">{{ error }}</v-alert>
      <v-alert
        v-if="message"
        class="mb-2"
        closable
        type="success"
        variant="tonal"
        @click:close="message = ''"
      >
        {{ message }}
      </v-alert>
      <v-progress-linear v-if="loading" indeterminate />
      <div v-else-if="!workplacesStore.workplaces.length" class="text-medium-emphasis">
        No workplace yet: add the places where you work, your rides to and from them are counted as commutes.
      </div>
      <v-list v-else density="compact">
        <v-list-item
          v-for="workplace in workplacesStore.workplaces"
          :key="workplace.id"
          :subtitle="`${diameterLabel(workplace.diameter)} wide`"
          :title="workplace.name || 'Workplace'"
        >
          <template #append>
            <v-btn
              :icon="mdiHistory"
              :loading="applying === workplace.id"
              size="small"
              title="Mark the activities already recorded as commutes"
              variant="text"
              @click="applyToPast(workplace)"
            />
            <v-btn
              :icon="mdiPencil"
              size="small"
              title="Edit"
              variant="text"
              @click="open(workplace)"
            />
            <v-btn
              :icon="mdiDelete"
              size="small"
              title="Delete"
              variant="text"
              @click="remove(workplace)"
            />
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>
    <v-dialog v-model="dialog" max-width="720">
      <WorkplaceForm :key="formKey" :workplace="editing" @cancel="dialog = false" @saved="saved" />
    </v-dialog>
  </v-card>
</template>
