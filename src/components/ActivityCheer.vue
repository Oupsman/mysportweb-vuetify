<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { mdiHandClap } from '@mdi/js'
  import { useSocialStore } from '@/stores/social'

  // the cheer button of an activity of another user, the count of the cheers on the user's own; who cheered
  // in its tooltip. The cheers are loaded with the comments (ActivityComments).
  const socialStore = useSocialStore()
  const social = computed(() => socialStore.social)
  const busy = ref(false)
  const error = ref('')

  const names = computed(() => (social.value?.cheers ?? []).map(c => c.username).join(', '))
  const count = computed(() => social.value?.cheers.length ?? 0)

  const toggle = async () => {
    if (!social.value) return
    error.value = ''
    busy.value = true
    try {
      await socialStore.cheer(!social.value.cheered)
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      busy.value = false
    }
  }
</script>

<template>
  <template v-if="social">
    <v-tooltip :disabled="count === 0" location="bottom" :text="`Cheered by ${names}`">
      <template #activator="{ props }">
        <v-btn
          v-if="social.can_cheer"
          v-bind="props"
          :color="social.cheered ? 'primary' : undefined"
          :loading="busy"
          :prepend-icon="mdiHandClap"
          :variant="social.cheered ? 'flat' : 'tonal'"
          @click="toggle"
        >
          {{ social.cheered ? 'Cheered' : 'Cheer' }}{{ count > 0 ? ` · ${count}` : '' }}
        </v-btn>
        <v-chip v-else-if="count > 0" v-bind="props" :prepend-icon="mdiHandClap" variant="tonal">
          {{ count }} {{ count > 1 ? 'cheers' : 'cheer' }}
        </v-chip>
      </template>
    </v-tooltip>
    <v-snackbar
      color="error"
      :model-value="!!error"
      :timeout="4000"
      @update:model-value="error = ''"
    >{{ error }}</v-snackbar>
  </template>
</template>
