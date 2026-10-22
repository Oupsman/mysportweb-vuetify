<script setup lang="ts">
  import { ref } from 'vue'
  import { useEquipmentsStore } from '@/stores/equipments'
  import { useAppStore } from '@/stores/app'
  import type { Equipment, EquipmentFields } from '@/types/equipments'

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
    maintenance_interval: props.equipment?.maintenance_interval ?? 0,
    // the first equipment becomes the default one
    is_default: props.equipment?.is_default ?? equipmentsStore.equipments.length === 0,
  })

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
      maintenance_interval: Number(form.value.maintenance_interval),
    }
    saving.value = true
    error.value = ''
    try {
      if (props.equipment) {
        await equipmentsStore.updateEquipment(props.equipment.id, fields)
      } else {
        await equipmentsStore.insertEquipment(fields)
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
          <v-col cols="12" sm="6">
            <v-text-field
              v-model.number="form.maintenance_interval"
              hint="Distance between two services, 0 for none"
              label="Service interval"
              min="0"
              persistent-hint
              :rules="[positive]"
              suffix="km"
              type="number"
            />
          </v-col>
        </v-row>
        <v-switch
          v-model="form.is_default"
          class="mt-2"
          color="primary"
          hint="Given to the activities you upload; only one equipment is the default one"
          label="Default equipment"
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
