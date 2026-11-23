<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { mdiDatabaseOutline } from '@mdi/js'
  import { useAccountStore } from '@/stores/account'
  import type { Storage } from '@/types/user'
  import { formatBytes } from '@/utils/format'

  const accountStore = useAccountStore()
  const storage = ref<Storage | null>(null)
  const error = ref('')

  onMounted(async () => {
    try {
      storage.value = await accountStore.getStorage()
    } catch (e) {
      error.value = (e as Error).message
    }
  })

  // the share of the quota used, null without quota
  const percent = computed(() => storage.value && storage.value.quota > 0
    ? Math.min(100, (storage.value.used / storage.value.quota) * 100)
    : null)
  const color = computed(() => percent.value === null ? 'primary'
    : percent.value >= 100 ? 'error' : percent.value >= 90 ? 'warning' : 'primary')
</script>

<template>
  <v-card>
    <v-card-item :prepend-icon="mdiDatabaseOutline">
      <v-card-title>Storage</v-card-title>
      <v-card-subtitle>Your activities, their thumbnails and your pictures</v-card-subtitle>
    </v-card-item>
    <v-card-text>
      <v-alert v-if="error" type="error" variant="tonal">{{ error }}</v-alert>
      <v-progress-linear v-else-if="!storage" indeterminate />
      <template v-else>
        <div class="mb-2">
          <strong>{{ formatBytes(storage.used) }}</strong>
          <span v-if="storage.quota > 0"> used of {{ formatBytes(storage.quota) }}</span>
          <span v-else> used, no quota</span>
        </div>
        <v-progress-linear
          v-if="percent !== null"
          :color="color"
          height="8"
          :model-value="percent"
          rounded
        />
        <div v-if="percent !== null && percent >= 90" class="text-caption mt-2">
          {{ percent >= 100 ? 'Your storage is full: new uploads are refused.' : 'Your storage is almost full.' }}
          Delete activities you don't need, or ask an admin of the instance for more space.
        </div>
      </template>
    </v-card-text>
  </v-card>
</template>
