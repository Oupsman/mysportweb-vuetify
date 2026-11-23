<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import { mdiWatch } from '@mdi/js'
  import DeviceCard from '@/components/DeviceCard.vue'
  import { useDevicesStore } from '@/stores/devices'
  import { useAppStore } from '@/stores/app'
  import type { AltitudeCorrection, Device } from '@/types/devices'
  import { correctionTitle, deviceName, maxDeviceLabel, unitLabel } from '@/utils/devices'

  const devicesStore = useDevicesStore()
  const appStore = useAppStore()

  const isLoading = ref(true)
  const error = ref('')
  // the device being changed
  const busy = ref<string | null>(null)

  onMounted(async () => {
    try {
      await devicesStore.getAllDevices()
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      isLoading.value = false
    }
  })

  const setCorrection = async (device: Device, correction: AltitudeCorrection) => {
    error.value = ''
    busy.value = device.id
    try {
      await devicesStore.setAltitudeCorrection(device.id, correction)
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      busy.value = null
    }
  }

  const recompute = async (device: Device) => {
    const n = device.activities
    if (!confirm(`Recompute the altitudes of ${n} ${n > 1 ? 'activities' : 'activity'} of ${deviceName(device)} ` +
      `with "${correctionTitle(device.altitude_correction)}"? It runs in the background.`)) {
      return
    }
    error.value = ''
    busy.value = device.id
    try {
      await devicesStore.recompute(device.id)
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      busy.value = null
    }
  }

  // the progress of the recomputes, read again while one runs
  const running = computed(() => devicesStore.devices.some(d => d.recompute?.running))
  let polling: ReturnType<typeof setInterval> | undefined
  const stopPolling = () => {
    clearInterval(polling)
    polling = undefined
  }
  watch(running, isRunning => {
    if (isRunning && !polling) {
      polling = setInterval(() => {
        devicesStore.getAllDevices().catch(e => {
          error.value = (e as Error).message
          stopPolling()
        })
      }, 2000)
    } else if (!isRunning) {
      stopPolling()
    }
  }, { immediate: true })
  onBeforeUnmount(stopPolling)

  // rename dialog: the device renamed, and its new name ('' for the one of its files)
  const renaming = ref<Device | null>(null)
  const newLabel = ref('')
  const renameError = ref('')
  const isRenaming = ref(false)
  const labelRules = [(v: string) => v.trim().length <= maxDeviceLabel || `${maxDeviceLabel} characters at most`]

  const openRename = (device: Device) => {
    renaming.value = device
    newLabel.value = device.label || device.name
    renameError.value = ''
  }

  const rename = async () => {
    const device = renaming.value
    if (!device) {
      return
    }
    // its files' name typed back is no name of its own
    const label = newLabel.value.trim() === device.name ? '' : newLabel.value.trim()
    if (label.length > maxDeviceLabel) {
      return
    }
    isRenaming.value = true
    renameError.value = ''
    try {
      await devicesStore.renameDevice(device.id, label)
      renaming.value = null
    } catch (e) {
      renameError.value = (e as Error).message
    } finally {
      isRenaming.value = false
    }
  }

  // merge dialog: the device merged, and the one it goes into
  const merging = ref<Device | null>(null)
  const into = ref<string | null>(null)
  const mergeError = ref('')
  const isMerging = ref(false)

  const activitiesLabel = (n: number) => `${n} ${n > 1 ? 'activities' : 'activity'}`

  // the other devices, the ones of the same model first: the usual case, a unit whose files changed
  const targets = computed(() => {
    const device = merging.value
    if (!device) {
      return []
    }
    const sameModel = (d: Device) => d.brand === device.brand && d.model === device.model
    return devicesStore.devices
      .filter(d => d.id !== device.id)
      .sort((a, b) => Number(sameModel(b)) - Number(sameModel(a)))
      .map(d => ({
        title: `${deviceName(d)} · ${unitLabel(d)}`,
        value: d.id,
        subtitle: activitiesLabel(d.activities),
      }))
  })

  const target = computed(() => devicesStore.devices.find(d => d.id === into.value) ?? null)

  const openMerge = (device: Device) => {
    merging.value = device
    mergeError.value = ''
    // the only other unit of the model is the likely one
    const candidates = devicesStore.devices.filter(d =>
      d.id !== device.id && d.brand === device.brand && d.model === device.model)
    into.value = candidates.length === 1 ? candidates[0].id : null
  }

  const merge = async () => {
    if (!merging.value || !into.value) {
      return
    }
    isMerging.value = true
    mergeError.value = ''
    try {
      await devicesStore.mergeDevice(merging.value.id, into.value)
      merging.value = null
    } catch (e) {
      mergeError.value = (e as Error).message
    } finally {
      isMerging.value = false
    }
  }

  // the activities page filters on the device of its query: the unit, not every unit of the model
  const showActivities = (device: Device) => appStore.navigateToPage(`/activities?device_id=${device.id}`)
</script>

<template>
  <div>
    <v-alert
      v-if="error"
      class="mb-4"
      closable
      type="error"
      @click:close="error = ''"
    >{{ error }}</v-alert>

    <div v-if="isLoading">Loading...</div>
    <v-card v-else-if="devicesStore.devices.length === 0" class="pa-8 text-center">
      <v-icon class="mb-2" :icon="mdiWatch" size="x-large" />
      <div class="text-h6">No device yet</div>
      <div class="text-medium-emphasis">
        Your watches and bike computers appear here once you upload an activity they recorded.
      </div>
    </v-card>
    <v-row v-else>
      <v-col
        v-for="device in devicesStore.devices"
        :key="device.id"
        cols="12"
        lg="4"
        sm="6"
      >
        <DeviceCard
          :busy="busy === device.id"
          :can-merge="devicesStore.devices.length > 1"
          :device="device"
          @activities="showActivities"
          @correction="setCorrection"
          @merge="openMerge"
          @recompute="recompute"
          @rename="openRename"
        />
      </v-col>
    </v-row>

    <v-dialog max-width="480" :model-value="renaming !== null" @update:model-value="v => { if (!v) renaming = null }">
      <v-card v-if="renaming" :title="`Rename ${deviceName(renaming)}`">
        <v-card-subtitle>{{ renaming.name }} · {{ unitLabel(renaming) }}</v-card-subtitle>
        <v-form @submit.prevent="rename">
          <v-card-text>
            <v-text-field
              v-model="newLabel"
              autofocus
              clearable
              :counter="maxDeviceLabel"
              density="compact"
              label="Name"
              persistent-placeholder
              :placeholder="renaming.name"
              :rules="labelRules"
              variant="outlined"
              @click:clear="newLabel = ''"
            />
            <div class="text-caption text-medium-emphasis">
              Shown in place of "{{ renaming.name }}", the name its files give, which stays to recognize
              its activities. Empty to use that name again. Only you see it.
            </div>
            <v-alert v-if="renameError" class="mt-4" density="compact" type="error">{{ renameError }}</v-alert>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn :disabled="isRenaming" variant="text" @click="renaming = null">Cancel</v-btn>
            <v-btn color="primary" :loading="isRenaming" type="submit" variant="flat">Save</v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>

    <v-dialog max-width="560" :model-value="merging !== null" @update:model-value="v => { if (!v) merging = null }">
      <v-card v-if="merging" :title="`Merge ${deviceName(merging)}`">
        <v-card-subtitle>{{ unitLabel(merging) }} · {{ activitiesLabel(merging.activities) }}</v-card-subtitle>
        <v-card-text>
          <p class="mb-4">
            When the files of a unit changed how they name it (a firmware update adding the serial number...),
            it appears as two devices. Merged into the other one, its activities move there, and so will the
            activities imported later under this name.
          </p>
          <v-select
            v-model="into"
            density="compact"
            :item-props="true"
            :items="targets"
            label="The same unit as"
            variant="outlined"
          />
          <v-alert
            v-if="target && target.altitude_correction !== merging.altitude_correction"
            class="mt-2"
            density="compact"
            type="info"
            variant="tonal"
          >
            The altitudes setting of {{ deviceName(target) }} applies: "{{ correctionTitle(target.altitude_correction) }}".
            The activities moved keep the altitudes they have ("{{ correctionTitle(merging.altitude_correction) }}")
            until you recompute them.
          </v-alert>
          <div class="text-caption text-medium-emphasis mt-2">A merge can't be undone.</div>
          <v-alert v-if="mergeError" class="mt-4" density="compact" type="error">{{ mergeError }}</v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn :disabled="isMerging" variant="text" @click="merging = null">Cancel</v-btn>
          <v-btn
            color="primary"
            :disabled="!into"
            :loading="isMerging"
            variant="flat"
            @click="merge"
          >Merge</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
