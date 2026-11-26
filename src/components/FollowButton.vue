<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { mdiAccountCheck, mdiAccountClock, mdiAccountPlus } from '@mdi/js'
  import { useFollowsStore } from '@/stores/follows'
  import type { FollowState } from '@/types/follows'

  // follows a user, takes back a request, stops following
  const props = defineProps<{ uuid: string, username: string, state: FollowState }>()
  const emit = defineEmits<{ 'update:state': [state: FollowState], error: [message: string] }>()

  const followsStore = useFollowsStore()
  const busy = ref(false)

  const look = computed(() => ({
    none: { text: 'Follow', icon: mdiAccountPlus, variant: 'flat' as const, title: '' },
    pending: { text: 'Requested', icon: mdiAccountClock, variant: 'tonal' as const, title: 'Take back the request' },
    following: { text: 'Following', icon: mdiAccountCheck, variant: 'tonal' as const, title: 'Stop following' },
  })[props.state])

  const click = async () => {
    if (props.state === 'following' && !confirm(`Stop following ${props.username}?`)) return
    busy.value = true
    try {
      emit('update:state', props.state === 'none'
        ? await followsStore.follow(props.uuid)
        : await followsStore.unfollow(props.uuid))
    } catch (e) {
      emit('error', (e as Error).message)
    } finally {
      busy.value = false
    }
  }
</script>

<template>
  <v-btn
    color="primary"
    :loading="busy"
    :prepend-icon="look.icon"
    size="small"
    :title="look.title"
    :variant="look.variant"
    @click.stop.prevent="click"
  >{{ look.text }}</v-btn>
</template>
