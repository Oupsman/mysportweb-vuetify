<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import EquipmentPicture from '@/components/EquipmentPicture.vue'
  import { useEquipmentsStore } from '@/stores/equipments'
  import { useAppStore } from '@/stores/app'
  import type { Equipment, EquipmentFields } from '@/types/equipments'
  import { sportIcon, sportLabel } from '@/utils/format'

  // without equipment, the form creates one
  const props = defineProps<{ equipment?: Equipment }>()

  const equipmentsStore = useEquipmentsStore()
  const appStore = useAppStore()

  // the date input works on YYYY-MM-DD; the backend sends year 1 for an unknown date. A purchase date is
  // a day, saved at midnight UTC: read in UTC, whatever the timezone the backend answers in
  const toDateInput = (date: string | null | undefined): string =>
    date && new Date(date).getUTCFullYear() > 1900 ? new Date(date).toISOString().slice(0, 10) : ''

  const form = ref({
    name: props.equipment?.name ?? '',
    brand: props.equipment?.brand ?? '',
    model: props.equipment?.model ?? '',
    date_of_purchase: toDateInput(props.equipment?.date_of_purchase),
    initial_mileage: props.equipment?.initial_mileage ?? 0,
    weight: props.equipment?.weight ?? 0,
    default_sports: [...(props.equipment?.default_sports ?? [])],
    is_commute: props.equipment?.is_commute ?? false,
  })

  // the sports to choose from: the user's first, then every other one (typing filters them)
  const userSports = ref<string[]>([])
  const allSports = ref<string[]>([])
  const sportsError = ref('')
  onMounted(async () => {
    try {
      const sports = await equipmentsStore.getSports()
      userSports.value = sports.sports
      allSports.value = sports.all
    } catch (e) {
      sportsError.value = (e as Error).message
    }
  })
  const sportItems = computed(() => [
    ...userSports.value,
    ...allSports.value.filter(s => !userSports.value.includes(s)),
  ].map(sport => ({ title: sportLabel(sport), value: sport })))

  // the sports chosen here that another equipment is the default of: they move to this one
  const takenFrom = computed(() => form.value.default_sports.flatMap(sport => {
    const other = equipmentsStore.equipments.find(e => e.id !== props.equipment?.id && e.default_sports.includes(sport))
    return other ? [`${sportLabel(sport).toLowerCase()} from ${other.name}`] : []
  }))

  // the picture of a new equipment, uploaded once it is created
  const pendingPicture = ref<File | null>(null)
  // the edited equipment from the store: its picture changes as soon as one is uploaded
  const current = computed(() => equipmentsStore.equipments.find(e => e.id === props.equipment?.id) ?? props.equipment)

  const valid = ref(false)
  const saving = ref(false)
  const error = ref('')

  const required = (v: string) => v.trim() !== '' || 'Required'
  const positive = (v: number | string) => (v !== '' && Number.isInteger(Number(v)) && Number(v) >= 0) || 'A positive whole number'
  const today = new Date().toISOString().slice(0, 10)

  const save = async () => {
    if (!valid.value) {
      return
    }
    const fields: EquipmentFields = {
      ...form.value,
      name: form.value.name.trim(),
      brand: form.value.brand.trim(),
      model: form.value.model.trim(),
      date_of_purchase: form.value.date_of_purchase ? new Date(form.value.date_of_purchase).toISOString() : null,
      initial_mileage: Number(form.value.initial_mileage),
      weight: Number(form.value.weight),
    }
    saving.value = true
    error.value = ''
    try {
      let id = props.equipment?.id
      if (id) {
        await equipmentsStore.updateEquipment(id, fields)
      } else {
        id = await equipmentsStore.insertEquipment(fields)
        if (pendingPicture.value) {
          try {
            await equipmentsStore.uploadPicture(id, pendingPicture.value)
          } catch (e) {
            // the equipment exists: the picture can be added again from its edit page
            alert(`The equipment is created, but ${(e as Error).message.toLowerCase()}.`)
            appStore.navigateToPage(`/equipment/${id}/edit`)
            return
          }
        }
      }
      // the new commutes get it automatically, the ones already recorded only if the user wants
      if (fields.is_commute && !props.equipment?.is_commute &&
        confirm(`Also give "${fields.name}" to the commute rides you already recorded?`)) {
        await equipmentsStore.assignToCommutes(id)
      }
      appStore.navigateToPage('/equipments')
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      saving.value = false
    }
  }
</script>

<template>
  <v-card max-width="720">
    <v-card-text>
      <v-alert v-if="error" class="mb-4" type="error">{{ error }}</v-alert>
      <v-form v-model="valid" @submit.prevent="save">
        <v-text-field
          v-model="form.name"
          autofocus
          counter="100"
          hint="How you call it, e.g. Road bike"
          label="Name"
          maxlength="100"
          :rules="[required]"
        />
        <EquipmentPicture
          v-model:pending="pendingPicture"
          class="mb-4"
          :equipment-id="equipment?.id"
          :picture="current?.picture"
        />
        <v-row>
          <v-col cols="12" sm="6">
            <v-text-field v-model="form.brand" label="Brand" />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field v-model="form.model" label="Model" />
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" sm="6">
            <v-text-field v-model="form.date_of_purchase" label="Date of purchase" :max="today" type="date" />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model.number="form.weight"
              label="Weight"
              min="0"
              :rules="[positive]"
              suffix="kg"
              type="number"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model.number="form.initial_mileage"
              hint="Its distance before the activities recorded here"
              label="Initial mileage"
              min="0"
              persistent-hint
              :rules="[positive]"
              suffix="km"
              type="number"
            />
          </v-col>
        </v-row>
        <v-autocomplete
          v-model="form.default_sports"
          chips
          class="mt-4"
          closable-chips
          :error-messages="sportsError"
          hint="Given to the activities of these sports you upload; one equipment per sport. The activities already uploaded keep theirs"
          :items="sportItems"
          label="Default equipment of"
          multiple
          persistent-hint
          placeholder="No sport"
        >
          <template #chip="{ props: chipProps, item }">
            <v-chip v-bind="chipProps" :prepend-icon="sportIcon(item.value)" />
          </template>
        </v-autocomplete>
        <v-alert
          v-if="takenFrom.length"
          class="mt-2"
          density="compact"
          type="info"
          variant="tonal"
        >
          Saving moves the default of {{ takenFrom.join(', ') }} to this equipment.
        </v-alert>
        <v-switch
          v-model="form.is_commute"
          class="mt-2"
          color="primary"
          hint="Given to your commute rides instead of the default equipment, whether they are recognized from their route or marked by hand"
          label="Commute bike"
          persistent-hint
        />
        <div class="d-flex ga-2 mt-6">
          <v-spacer />
          <v-btn variant="text" @click="appStore.navigateToPage('/equipments')">Cancel</v-btn>
          <v-btn color="primary" :disabled="!valid" :loading="saving" type="submit">
            {{ equipment ? 'Save' : 'Create' }}
          </v-btn>
        </div>
      </v-form>
    </v-card-text>
  </v-card>
</template>
