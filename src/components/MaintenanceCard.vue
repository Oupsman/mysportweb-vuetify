<script setup lang="ts">
  import { onMounted, ref, watch } from 'vue'
  import { mdiBellOutline, mdiCheck, mdiWrenchOutline } from '@mdi/js'
  import { useAppStore } from '@/stores/app'
  import { useEquipmentsStore } from '@/stores/equipments'
  import type { Reminder } from '@/types/equipments'
  import { reminderColor, reminderStatusText } from '@/utils/reminders'

  // the maintenance reminders due or soon of all the equipments; count: how many, the dashboard hides the
  // widget when there is none
  const emit = defineEmits<{ count: [n: number] }>()
  const appStore = useAppStore()
  const equipmentsStore = useEquipmentsStore()
  const reminders = ref<Reminder[]>([])
  const error = ref('')
  const marking = ref<string | null>(null)

  const load = async () => {
    try {
      reminders.value = await equipmentsStore.getMaintenance()
    } catch {
      // the dashboard shows without it
      reminders.value = []
    }
  }
  onMounted(load)
  watch(() => reminders.value.length, n => emit('count', n))

  const open = (reminder: Reminder) => appStore.navigateToPage(`/equipment/${reminder.equipment_id}/edit#reminders`)

  // done in one click: a service of now at the mileage of the equipment
  const markDone = async (reminder: Reminder) => {
    marking.value = reminder.id
    error.value = ''
    try {
      await equipmentsStore.reminderDone(reminder.equipment_id, reminder.id)
      await load()
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      marking.value = null
    }
  }
</script>

<template>
  <v-card class="widget-card">
    <v-card-item>
      <template #prepend>
        <v-icon color="primary" :icon="mdiWrenchOutline" />
      </template>
      <v-card-title>Maintenance</v-card-title>
      <v-card-subtitle>Due or soon on your equipment</v-card-subtitle>
    </v-card-item>
    <v-card-text>
      <v-alert
        v-if="error"
        class="mb-2"
        closable
        density="compact"
        type="error"
        @click:close="error = ''"
      >{{ error }}</v-alert>
      <div v-if="!reminders.length" class="text-body-2 text-medium-emphasis">Nothing due on your equipment.</div>
      <v-list v-else density="compact">
        <v-list-item v-for="reminder in reminders" :key="reminder.id" @click="open(reminder)">
          <template #prepend>
            <v-icon :color="reminderColor(reminder.state)" :icon="mdiBellOutline" />
          </template>
          <v-list-item-title>{{ reminder.name }}</v-list-item-title>
          <v-list-item-subtitle>
            {{ reminder.equipment_name }} ·
            <span :class="`text-${reminderColor(reminder.state)}`">{{ reminderStatusText(reminder) }}</span>
          </v-list-item-subtitle>
          <template #append>
            <v-btn
              :color="reminderColor(reminder.state)"
              :disabled="marking !== null"
              :loading="marking === reminder.id"
              :prepend-icon="mdiCheck"
              size="small"
              variant="tonal"
              @click.stop="markDone(reminder)"
            >Done</v-btn>
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>
