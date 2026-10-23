<script setup lang="ts">
  import { computed, onBeforeUnmount, ref, watch } from 'vue'
  import { mdiCameraOutline, mdiDeleteOutline } from '@mdi/js'
  import { mediaUrl } from '@/api'
  import { useEquipmentsStore } from '@/stores/equipments'

  // with an equipment id, a chosen picture is uploaded at once; without (a new equipment), it is kept
  // in pending for the form to upload once the equipment exists
  const props = defineProps<{ equipmentId?: string, picture?: string }>()
  const pending = defineModel<File | null>('pending', { default: null })

  const equipmentsStore = useEquipmentsStore()
  const busy = ref(false)
  const error = ref('')
  const input = ref<HTMLInputElement | null>(null)

  // the preview of a picture not uploaded yet
  const pendingUrl = ref('')
  watch(pending, file => {
    if (pendingUrl.value) URL.revokeObjectURL(pendingUrl.value)
    pendingUrl.value = file ? URL.createObjectURL(file) : ''
  })
  onBeforeUnmount(() => pendingUrl.value && URL.revokeObjectURL(pendingUrl.value))

  const shown = computed(() => pendingUrl.value || (props.picture ? mediaUrl(props.picture) : ''))

  const accept = 'image/jpeg,image/png,image/webp'
  const maxSize = 15 * 1024 * 1024

  const choose = async (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    ;(event.target as HTMLInputElement).value = ''
    if (!file) return
    error.value = ''
    // checked here to answer at once, the backend checks again
    if (!accept.split(',').includes(file.type)) {
      error.value = 'Choose a JPEG, PNG or WebP picture'
      return
    }
    if (file.size > maxSize) {
      error.value = 'The picture is larger than 15 MB'
      return
    }
    if (!props.equipmentId) {
      pending.value = file
      return
    }
    busy.value = true
    try {
      await equipmentsStore.uploadPicture(props.equipmentId, file)
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      busy.value = false
    }
  }

  const remove = async () => {
    error.value = ''
    if (pending.value) {
      pending.value = null
      return
    }
    if (!props.equipmentId) return
    busy.value = true
    try {
      await equipmentsStore.deletePicture(props.equipmentId)
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      busy.value = false
    }
  }
</script>

<template>
  <div>
    <div class="text-subtitle-2 mb-2">Picture</div>
    <div class="d-flex flex-wrap align-center ga-4">
      <v-sheet class="picture d-flex align-center justify-center overflow-hidden" color="grey-lighten-3" rounded>
        <v-img
          v-if="shown"
          cover
          height="120"
          :src="shown"
          width="160"
        />
        <v-icon v-else color="grey" :icon="mdiCameraOutline" size="large" />
        <v-overlay class="align-center justify-center" contained :model-value="busy" persistent>
          <v-progress-circular color="primary" indeterminate />
        </v-overlay>
      </v-sheet>
      <div class="d-flex flex-column ga-2">
        <v-btn :disabled="busy" :prepend-icon="mdiCameraOutline" variant="tonal" @click="input?.click()">
          {{ shown ? 'Replace' : 'Add a picture' }}
        </v-btn>
        <v-btn
          v-if="shown"
          color="error"
          :disabled="busy"
          :prepend-icon="mdiDeleteOutline"
          variant="text"
          @click="remove"
        >
          Remove
        </v-btn>
      </div>
      <input
        ref="input"
        :accept="accept"
        class="d-none"
        type="file"
        @change="choose"
      >
    </div>
    <div class="text-caption text-medium-emphasis mt-1">
      JPEG, PNG or WebP, 15 MB at most. Where the photo was taken is removed from the file.
    </div>
    <v-alert v-if="error" class="mt-2" density="compact" type="error">{{ error }}</v-alert>
  </div>
</template>

<style scoped>
.picture {
  position: relative;
  width: 160px;
  height: 120px;
}
</style>
