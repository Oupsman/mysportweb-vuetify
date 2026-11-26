<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import FeedList from '@/components/FeedList.vue'
  import FollowButton from '@/components/FollowButton.vue'
  import { useAppStore } from '@/stores/app'
  import { useFollowsStore } from '@/stores/follows'
  import type { FeedCursor, Profile } from '@/types/follows'

  // a user: their follows, and their activities the user of the session may see
  const route = useRoute('/athletes/[uuid]')
  const appStore = useAppStore()
  const followsStore = useFollowsStore()
  const profile = ref<Profile | null>(null)
  const error = ref('')

  const uuid = computed(() => route.params.uuid)
  const load = async () => {
    error.value = ''
    profile.value = null
    try {
      profile.value = await followsStore.profile(uuid.value)
      appStore.pageTitle = profile.value.user.username
    } catch (e) {
      error.value = (e as Error).message
    }
  }
  watch(uuid, load, { immediate: true })

  // a new function for another user: the list loads again
  const activities = computed(() => {
    const id = uuid.value
    return (cursor: FeedCursor | null) => followsStore.profileActivities(id, cursor)
  })

  // the counts follow the follow
  const onState = async (state: Profile['state']) => {
    if (profile.value) {
      profile.value.state = state
      try {
        profile.value.counts = (await followsStore.profile(uuid.value)).counts
      } catch {
        // the state changed: only the counts are stale
      }
    }
  }
</script>

<template>
  <v-container class="athlete">
    <v-alert v-if="error" type="error" variant="tonal">{{ error }}</v-alert>
    <template v-if="profile">
      <div class="d-flex align-center flex-wrap ga-3 mb-2">
        <h5 class="text-h5">{{ profile.user.username }}</h5>
        <v-chip v-if="profile.follows_you" size="small" variant="tonal">Follows you</v-chip>
        <v-spacer />
        <FollowButton
          v-if="!profile.me"
          :state="profile.state"
          :username="profile.user.username"
          :uuid="profile.user.uuid"
          @error="error = $event"
          @update:state="onState"
        />
        <v-btn v-else to="/followers" variant="tonal">Your followers</v-btn>
      </div>
      <p class="text-medium-emphasis mb-6">
        {{ profile.counts.followers }} {{ profile.counts.followers === 1 ? 'follower' : 'followers' }} ·
        {{ profile.counts.following }} following
      </p>
      <FeedList :key="uuid" :load="activities" :show-owner="false">
        <template #empty>No activity you can see.</template>
      </FeedList>
    </template>
  </v-container>
</template>

<style scoped lang="sass">
.athlete
  max-width: 760px
</style>
