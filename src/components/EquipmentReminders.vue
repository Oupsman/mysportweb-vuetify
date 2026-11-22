<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { mdiBellOutline, mdiCheck, mdiDeleteOutline, mdiPencilOutline, mdiPlus } from '@mdi/js'
  import { useEquipmentsStore } from '@/stores/equipments'
  import type { Equipment, Reminder, ReminderFields } from '@/types/equipments'
  import { formatDate } from '@/utils/format'
  import {
    intervalText,
    reminderColor,
    reminderPresets,
    reminderStatusText,
    reminderUnits,
  } from '@/utils/reminders'

  const props = defineProps<{ equipment: Equipment }>()
  // a reminder marked done: a service was logged
  const emit = defineEmits<{ done: [] }>()

  const equipmentsStore = useEquipmentsStore()

  // from the store: they change with the services and the activities
  const current = computed(() => equipmentsStore.equipments.find(e => e.id === props.equipment.id) ?? props.equipment)
  const reminders = computed(() => current.value.reminders ?? [])

  const error = ref('')
  const busy = ref<string | null>(null)

  // the date input works on YYYY-MM-DD; today is now, an earlier day midnight UTC like the services
  const today = () => new Date().toISOString().slice(0, 10)
  const toDateInput = (date: string) => new Date(date).toISOString().slice(0, 10)
  const dateValue = (day: string) => day === today() ? new Date().toISOString() : day

  // creation and edition, editing null for a new one
  const dialog = ref(false)
  const editing = ref<Reminder | null>(null)
  const saving = ref(false)
  const dialogError = ref('')
  const blank = (): ReminderFields => ({ name: '', every_km: 0, every_hours: 0, every_count: 0, every_unit: '', only_when_used: true })
  const form = ref<ReminderFields>(blank())
  const startDay = ref('')
  const startChanged = ref(false)

  const openDialog = (reminder: Reminder | null) => {
    editing.value = reminder
    form.value = reminder
      ? {
        name: reminder.name,
        every_km: reminder.every_km,
        every_hours: reminder.every_hours,
        every_count: reminder.every_count,
        every_unit: reminder.every_unit,
        only_when_used: reminder.only_when_used,
      }
      : blank()
    // a start at the epoch (an interval of the previous versions) counts every activity
    startDay.value = reminder && new Date(reminder.starts_at).getUTCFullYear() > 1970 ? toDateInput(reminder.starts_at) : today()
    startChanged.value = false
    dialogError.value = ''
    dialog.value = true
  }

  const usePreset = (preset: ReminderFields) => {
    form.value = { ...preset }
  }

  const hasTime = computed(() => form.value.every_count > 0)
  const canSave = computed(() => {
    const f = form.value
    const intervals = [f.every_km, f.every_hours, f.every_count]
    return f.name.trim() !== '' && intervals.every(v => Number(v) >= 0) && intervals.some(v => Number(v) > 0) &&
      (Number(f.every_count) === 0 || f.every_unit !== '') && startDay.value !== '' && startDay.value <= today()
  })

  const save = async () => {
    saving.value = true
    dialogError.value = ''
    const fields: ReminderFields = {
      name: form.value.name.trim(),
      every_km: Number(form.value.every_km) || 0,
      every_hours: Number(form.value.every_hours) || 0,
      every_count: Number(form.value.every_count) || 0,
      every_unit: Number(form.value.every_count) > 0 ? form.value.every_unit : '',
      only_when_used: form.value.only_when_used,
    }
    // a new one starts on its day; an edited one keeps its start unless changed
    if (!editing.value || startChanged.value) {
      fields.starts_at = dateValue(startDay.value)
    }
    try {
      await (editing.value
        ? equipmentsStore.updateReminder(props.equipment.id, editing.value.id, fields)
        : equipmentsStore.insertReminder(props.equipment.id, fields))
      dialog.value = false
    } catch (e) {
      dialogError.value = (e as Error).message
    } finally {
      saving.value = false
    }
  }

  const remove = async (reminder: Reminder) => {
    if (!confirm(`Delete the reminder "${reminder.name}"? The services done for it are kept.`)) {
      return
    }
    error.value = ''
    busy.value = reminder.id
    try {
      await equipmentsStore.deleteReminder(props.equipment.id, reminder.id)
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      busy.value = null
    }
  }

  // marking done: a service of its day, its mileage and a note
  const doneDialog = ref(false)
  const doneReminder = ref<Reminder | null>(null)
  const doneForm = ref({ date: '', mileage: 0, description: '' })
  const doneError = ref('')
  const openDone = (reminder: Reminder) => {
    doneReminder.value = reminder
    doneForm.value = { date: today(), mileage: Math.round(current.value.mileage), description: reminder.name }
    doneError.value = ''
    doneDialog.value = true
  }
  const canDone = computed(() => doneForm.value.date !== '' && doneForm.value.date <= today() && doneForm.value.mileage >= 0)
  const markDone = async () => {
    if (!doneReminder.value) {
      return
    }
    busy.value = doneReminder.value.id
    doneError.value = ''
    try {
      await equipmentsStore.reminderDone(props.equipment.id, doneReminder.value.id, {
        date: dateValue(doneForm.value.date),
        mileage: Number(doneForm.value.mileage),
        description: doneForm.value.description.trim(),
      })
      doneDialog.value = false
      emit('done')
    } catch (e) {
      doneError.value = (e as Error).message
    } finally {
      busy.value = null
    }
  }
</script>

<template>
  <v-card>
    <v-card-item>
      <v-card-title>Maintenance reminders</v-card-title>
      <v-card-subtitle class="text-wrap">
        Each is due after its distance, hours of activities or time since it was last done, whichever comes first,
        and notified once.
      </v-card-subtitle>
      <template #append>
        <v-btn color="primary" :prepend-icon="mdiPlus" @click="openDialog(null)">Add a reminder</v-btn>
      </template>
    </v-card-item>

    <v-card-text>
      <v-alert
        v-if="error"
        class="mb-4"
        closable
        type="error"
        @click:close="error = ''"
      >{{ error }}</v-alert>

      <div v-if="reminders.length === 0" class="text-medium-emphasis">
        No reminder yet: add one, such as checking the tire pressure every week or changing the chain every 3000 km.
      </div>
      <v-list v-else lines="three">
        <v-list-item v-for="reminder in reminders" :key="reminder.id">
          <template #prepend>
            <v-icon :color="reminder.state === 'ok' ? undefined : reminderColor(reminder.state)" :icon="mdiBellOutline" />
          </template>
          <v-list-item-title>{{ reminder.name }}</v-list-item-title>
          <v-list-item-subtitle>
            <span :class="reminder.state === 'ok' ? '' : `text-${reminderColor(reminder.state)}`">
              {{ reminderStatusText(reminder) }}
            </span>
            · {{ intervalText(reminder) }}
            <template v-if="reminder.every_count > 0 && !reminder.only_when_used"> even unused</template>
          </v-list-item-subtitle>
          <v-list-item-subtitle>
            {{ reminder.last_done ? `Last done ${formatDate(reminder.last_done)}` : 'Never done' }}
          </v-list-item-subtitle>
          <v-progress-linear
            class="mt-2"
            :color="reminderColor(reminder.state)"
            height="4"
            :model-value="Math.min(100, reminder.progress * 100)"
            rounded
          />
          <template #append>
            <v-btn
              class="mr-1"
              :color="reminder.state === 'ok' ? undefined : reminderColor(reminder.state)"
              :disabled="busy !== null"
              :loading="busy === reminder.id"
              :prepend-icon="mdiCheck"
              size="small"
              variant="tonal"
              @click="openDone(reminder)"
            >Done</v-btn>
            <v-btn
              :disabled="busy !== null"
              :icon="mdiPencilOutline"
              size="small"
              title="Edit"
              variant="text"
              @click="openDialog(reminder)"
            />
            <v-btn
              color="error"
              :disabled="busy !== null"
              :icon="mdiDeleteOutline"
              size="small"
              title="Delete"
              variant="text"
              @click="remove(reminder)"
            />
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>

    <v-dialog v-model="dialog" max-width="560" :persistent="saving">
      <v-card :title="editing ? 'Edit reminder' : 'Add a reminder'">
        <v-card-text>
          <v-alert v-if="dialogError" class="mb-4" type="error">{{ dialogError }}</v-alert>
          <div v-if="!editing" class="mb-4">
            <div class="text-caption text-medium-emphasis mb-1">Start from an example</div>
            <div class="d-flex flex-wrap ga-1">
              <v-chip
                v-for="preset in reminderPresets"
                :key="preset.name"
                size="small"
                :title="intervalText(preset)"
                @click="usePreset(preset)"
              >{{ preset.name }}</v-chip>
            </div>
          </div>
          <v-text-field v-model="form.name" label="Name" maxlength="100" />
          <div class="text-body-2 mb-2">Due every (whichever comes first, 0 for none)</div>
          <v-row dense>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model.number="form.every_km"
                label="Distance"
                min="0"
                suffix="km"
                type="number"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model.number="form.every_hours"
                label="Activity time"
                min="0"
                suffix="h"
                type="number"
              />
            </v-col>
            <v-col cols="5" sm="2">
              <v-text-field v-model.number="form.every_count" label="Time" min="0" type="number" />
            </v-col>
            <v-col cols="7" sm="2">
              <v-select
                v-model="form.every_unit"
                :disabled="!hasTime"
                :items="reminderUnits"
                label="Unit"
              />
            </v-col>
          </v-row>
          <v-switch
            v-model="form.only_when_used"
            color="primary"
            :disabled="!hasTime"
            hint="A week or a month without using the equipment doesn't make it due: it waits for the next activity"
            label="Time counts only when used"
            persistent-hint
          />
          <v-text-field
            v-model="startDay"
            class="mt-4"
            :hint="editing ? 'Its count until it is first done' : 'The last time you did it, if you know: counts from today otherwise'"
            label="Counting from"
            :max="today()"
            persistent-hint
            type="date"
            @update:model-value="startChanged = true"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn :disabled="saving" variant="text" @click="dialog = false">Cancel</v-btn>
          <v-btn color="primary" :disabled="!canSave" :loading="saving" @click="save">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="doneDialog" max-width="500" :persistent="busy !== null">
      <v-card :title="`Done: ${doneReminder?.name ?? ''}`">
        <v-card-text>
          <v-alert v-if="doneError" class="mb-4" type="error">{{ doneError }}</v-alert>
          <p class="text-body-2 mb-4">Logs a service, which starts its next cycle.</p>
          <v-text-field v-model="doneForm.date" label="Date" :max="today()" type="date" />
          <v-text-field
            v-model.number="doneForm.mileage"
            label="Mileage"
            min="0"
            suffix="km"
            type="number"
          />
          <v-textarea v-model="doneForm.description" label="Description" rows="2" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn :disabled="busy !== null" variant="text" @click="doneDialog = false">Cancel</v-btn>
          <v-btn color="primary" :disabled="!canDone" :loading="busy !== null" @click="markDone">Done</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>
