<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { mdiBellOutline, mdiBriefcaseOutline, mdiCheck, mdiDeleteOutline, mdiPencilOutline, mdiWrenchOutline } from '@mdi/js'
  import { mediaUrl } from '@/api'
  import { useEquipmentsStore } from '@/stores/equipments'
  import type { Equipment, Reminder } from '@/types/equipments'
  import { formatDate, formatDistance, formatDuration, sportIcon, sportLabel } from '@/utils/format'
  import { intervalText, reminderColor, reminderStatusText } from '@/utils/reminders'

  const props = defineProps<{ equipment: Equipment, busy?: boolean }>()
  const emit = defineEmits<{
    activities: [equipment: Equipment]
    edit: [equipment: Equipment]
    services: [equipment: Equipment]
    delete: [equipment: Equipment]
  }>()

  const km = (value: number) => formatDistance(value * 1000)

  // the backend sends year 1 for an unknown date. A purchase date is a day saved at midnight UTC,
  // shown in UTC: in the browser's timezone it would be the day before west of Greenwich
  const purchased = computed(() => {
    const date = props.equipment.date_of_purchase
    return date && new Date(date).getUTCFullYear() > 1900
      ? new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
        .format(new Date(date))
      : ''
  })

  // the most urgent reminders, the others on the edit page
  const shown = 3
  const reminders = computed(() => (props.equipment.reminders ?? []).slice(0, shown))
  const hidden = computed(() => Math.max(0, (props.equipment.reminders ?? []).length - shown))

  // done in one click: a service of now, at its mileage; a mistake is deleted from its services
  const equipmentsStore = useEquipmentsStore()
  const marking = ref<string | null>(null)
  const doneError = ref('')
  const markDone = async (reminder: Reminder) => {
    marking.value = reminder.id
    doneError.value = ''
    try {
      await equipmentsStore.reminderDone(props.equipment.id, reminder.id)
    } catch (e) {
      doneError.value = (e as Error).message
    } finally {
      marking.value = null
    }
  }
</script>

<template>
  <v-card border class="d-flex flex-column h-100" :class="{ 'border-primary border-opacity-100': equipment.default_sports.length > 0 }">
    <!-- flex-grow-0: the free height of a card goes to its text, every picture keeps the same height -->
    <v-img
      v-if="equipment.picture"
      :alt="equipment.name"
      class="flex-grow-0"
      cover
      height="180"
      :src="mediaUrl(equipment.picture)"
    />
    <v-card-item>
      <template v-if="!equipment.picture" #prepend>
        <v-avatar color="primary" variant="tonal">{{ equipment.name.charAt(0).toUpperCase() }}</v-avatar>
      </template>
      <v-card-title>{{ equipment.name }}</v-card-title>
      <v-card-subtitle v-if="equipment.brand || equipment.model">
        {{ [equipment.brand, equipment.model].filter(Boolean).join(' ') }}
      </v-card-subtitle>
      <template #append>
        <v-chip
          v-if="equipment.is_commute"
          :prepend-icon="mdiBriefcaseOutline"
          size="small"
          title="Given to the commute rides"
        >
          Commute
        </v-chip>
      </template>
    </v-card-item>

    <div v-if="equipment.default_sports.length" class="d-flex flex-wrap ga-1 px-4">
      <v-chip
        v-for="sport in equipment.default_sports"
        :key="sport"
        color="primary"
        :prepend-icon="sportIcon(sport)"
        size="small"
        :title="`Default equipment of the ${sportLabel(sport).toLowerCase()} activities you upload`"
      >
        {{ sportLabel(sport) }}
      </v-chip>
    </div>

    <v-card-text class="flex-grow-1">
      <div class="text-h4 font-weight-medium">{{ km(equipment.mileage) }}</div>
      <div v-if="equipment.initial_mileage > 0" class="text-caption text-medium-emphasis">
        {{ km(equipment.initial_mileage) }} before its first activity here
      </div>

      <div class="d-flex flex-wrap ga-4 mt-3">
        <div>
          <div class="text-caption text-medium-emphasis">Activities</div>
          <div>{{ equipment.activities }}</div>
        </div>
        <div v-if="equipment.duration > 0">
          <div class="text-caption text-medium-emphasis">Time</div>
          <div>{{ formatDuration(equipment.duration) }}</div>
        </div>
        <div>
          <div class="text-caption text-medium-emphasis">Last used</div>
          <div>{{ equipment.last_used ? formatDate(equipment.last_used) : 'Never' }}</div>
        </div>
        <div v-if="equipment.last_service">
          <div class="text-caption text-medium-emphasis">Last service</div>
          <div>{{ formatDate(equipment.last_service) }}</div>
        </div>
        <div v-if="purchased">
          <div class="text-caption text-medium-emphasis">Purchased</div>
          <div>{{ purchased }}</div>
        </div>
        <div v-if="equipment.weight > 0">
          <div class="text-caption text-medium-emphasis">Weight</div>
          <div>{{ equipment.weight }} kg</div>
        </div>
      </div>

      <div v-if="reminders.length" class="mt-4 d-flex flex-column ga-3">
        <div v-for="reminder in reminders" :key="reminder.id">
          <div class="d-flex align-center text-body-2 mb-1 ga-1">
            <v-icon
              :color="reminder.state === 'ok' ? undefined : reminderColor(reminder.state)"
              :icon="mdiBellOutline"
              size="small"
            />
            <span class="text-truncate" :title="`${reminder.name}, ${intervalText(reminder)}`">{{ reminder.name }}</span>
            <v-spacer />
            <span
              class="text-caption text-no-wrap"
              :class="reminder.state === 'ok' ? 'text-medium-emphasis' : `text-${reminderColor(reminder.state)}`"
            >{{ reminderStatusText(reminder) }}</span>
            <v-btn
              v-if="reminder.state !== 'ok'"
              :color="reminderColor(reminder.state)"
              density="comfortable"
              :disabled="busy || marking !== null"
              :icon="mdiCheck"
              :loading="marking === reminder.id"
              size="x-small"
              :title="`Mark done today: ${reminder.name}`"
              variant="tonal"
              @click="markDone(reminder)"
            />
          </div>
          <v-progress-linear
            :color="reminderColor(reminder.state)"
            height="6"
            :model-value="Math.min(100, reminder.progress * 100)"
            rounded
          />
        </div>
        <div v-if="hidden" class="text-caption text-medium-emphasis">and {{ hidden }} more</div>
        <v-alert
          v-if="doneError"
          closable
          density="compact"
          type="error"
          @click:close="doneError = ''"
        >{{ doneError }}</v-alert>
      </div>
    </v-card-text>

    <v-card-actions>
      <v-btn :disabled="equipment.activities === 0" variant="text" @click="emit('activities', equipment)">
        Activities
      </v-btn>
      <v-spacer />
      <v-btn
        :disabled="busy"
        :icon="mdiWrenchOutline"
        size="small"
        title="Services"
        variant="text"
        @click="emit('services', equipment)"
      />
      <v-btn
        :disabled="busy"
        :icon="mdiPencilOutline"
        size="small"
        title="Edit"
        variant="text"
        @click="emit('edit', equipment)"
      />
      <v-btn
        color="error"
        :disabled="busy"
        :icon="mdiDeleteOutline"
        size="small"
        title="Delete"
        variant="text"
        @click="emit('delete', equipment)"
      />
    </v-card-actions>
  </v-card>
</template>
