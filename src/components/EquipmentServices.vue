<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { mdiDeleteOutline, mdiPencilOutline, mdiPlus, mdiWrenchOutline } from '@mdi/js'
  import { useEquipmentsStore } from '@/stores/equipments'
  import type { Equipment, EquipmentService } from '@/types/equipments'
  import { formatDistance } from '@/utils/format'

  const props = defineProps<{ equipment: Equipment }>()

  const equipmentsStore = useEquipmentsStore()

  const services = ref<EquipmentService[]>([])
  const isLoading = ref(true)
  const error = ref('')
  const busy = ref<string | null>(null)

  const km = (value: number) => formatDistance(value * 1000)

  // the date input works on YYYY-MM-DD, in UTC like the dates the backend saves from it
  const today = () => new Date().toISOString().slice(0, 10)
  const toDateInput = (date: string) => new Date(date).toISOString().slice(0, 10)
  const formatDay = (date: string) =>
    new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
      .format(new Date(date))

  // the current mileage, from the store: it changes with the services
  const mileage = computed(() =>
    equipmentsStore.equipments.find(e => e.id === props.equipment.id)?.mileage ?? props.equipment.mileage)

  const load = async () => {
    error.value = ''
    try {
      services.value = await equipmentsStore.getServices(props.equipment.id)
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      isLoading.value = false
    }
  }
  onMounted(load)

  // creation and edition dialog, editing is null for a new service
  const dialog = ref(false)
  const editing = ref<EquipmentService | null>(null)
  const saving = ref(false)
  const dialogError = ref('')
  const form = ref({ date: '', mileage: 0, description: '' })

  const openDialog = (service: EquipmentService | null) => {
    editing.value = service
    form.value = service
      ? { date: toDateInput(service.date), mileage: service.mileage, description: service.description }
      : { date: today(), mileage: Math.round(mileage.value), description: '' }
    dialogError.value = ''
    dialog.value = true
  }

  const canSave = computed(() => form.value.date !== '' && form.value.date <= today() && form.value.mileage >= 0)

  const save = async () => {
    saving.value = true
    dialogError.value = ''
    // a day is saved at midnight UTC: the activities of that day would count after the service.
    // An unchanged date keeps its time, today is now: only the next activities count after it
    const unchanged = editing.value && toDateInput(editing.value.date) === form.value.date
    const date = unchanged
      ? editing.value!.date
      : (form.value.date === today() ? new Date().toISOString() : form.value.date)
    const fields = { date, mileage: Number(form.value.mileage), description: form.value.description.trim() }
    try {
      await (editing.value
        ? equipmentsStore.updateService(props.equipment.id, editing.value.id, fields)
        : equipmentsStore.insertService(props.equipment.id, fields))
      dialog.value = false
      await load()
    } catch (e) {
      dialogError.value = (e as Error).message
    } finally {
      saving.value = false
    }
  }

  const remove = async (service: EquipmentService) => {
    if (!confirm(`Delete the service of ${formatDay(service.date)}?`)) {
      return
    }
    error.value = ''
    busy.value = service.id
    try {
      await equipmentsStore.deleteService(props.equipment.id, service.id)
      services.value = services.value.filter(s => s.id !== service.id)
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      busy.value = null
    }
  }
</script>

<template>
  <v-card>
    <v-card-item>
      <v-card-title>Services</v-card-title>
      <v-card-subtitle>The maintenance reminder counts the distance from the latest one.</v-card-subtitle>
      <template #append>
        <v-btn color="primary" :prepend-icon="mdiPlus" @click="openDialog(null)">Log a service</v-btn>
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

      <div v-if="isLoading">Loading...</div>
      <div v-else-if="services.length === 0" class="text-medium-emphasis">No service yet.</div>
      <v-list v-else lines="two">
        <v-list-item v-for="service in services" :key="service.id">
          <template #prepend>
            <v-icon :icon="mdiWrenchOutline" />
          </template>
          <v-list-item-title>
            {{ formatDay(service.date) }}
            <span class="text-medium-emphasis"> · {{ km(service.mileage) }}</span>
          </v-list-item-title>
          <v-list-item-subtitle class="text-pre-wrap">{{ service.description || 'No description' }}</v-list-item-subtitle>
          <template #append>
            <v-btn
              :disabled="busy !== null"
              :icon="mdiPencilOutline"
              size="small"
              title="Edit"
              variant="text"
              @click="openDialog(service)"
            />
            <v-btn
              color="error"
              :disabled="busy !== null"
              :icon="mdiDeleteOutline"
              :loading="busy === service.id"
              size="small"
              title="Delete"
              variant="text"
              @click="remove(service)"
            />
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>

    <v-dialog v-model="dialog" max-width="500" :persistent="saving">
      <v-card :title="editing ? 'Edit service' : 'Log a service'">
        <v-card-text>
          <v-alert v-if="dialogError" class="mb-4" type="error">{{ dialogError }}</v-alert>
          <v-text-field v-model="form.date" label="Date" :max="today()" type="date" />
          <v-text-field
            v-model.number="form.mileage"
            hint="The mileage of the equipment when serviced"
            label="Mileage"
            min="0"
            persistent-hint
            suffix="km"
            type="number"
          />
          <v-textarea
            v-model="form.description"
            class="mt-2"
            label="Description"
            placeholder="Chain replaced, brakes bled..."
            rows="3"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn :disabled="saving" variant="text" @click="dialog = false">Cancel</v-btn>
          <v-btn color="primary" :disabled="!canSave" :loading="saving" @click="save">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>
