<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { mdiAccountRemove, mdiCheck, mdiClose } from '@mdi/js'
  import { useFollowsStore } from '@/stores/follows'
  import type { FollowView } from '@/types/follows'

  // the followers of the user (and their requests), the users they follow, and whether they accept each follower
  const followsStore = useFollowsStore()
  const follows = computed(() => followsStore.follows)
  const requests = computed(() => (follows.value?.followers ?? []).filter(f => !f.accepted_at))
  const followers = computed(() => (follows.value?.followers ?? []).filter(f => f.accepted_at))
  const busy = ref(false)
  const error = ref('')

  const run = async (action: () => Promise<unknown>) => {
    busy.value = true
    error.value = ''
    try {
      await action()
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      busy.value = false
    }
  }
  onMounted(() => run(followsStore.loadFollows))

  const setApproval = (on: boolean | null) => run(() => followsStore.setApproval(!!on))
  const remove = (f: FollowView) => {
    if (confirm(`Remove ${f.username} from your followers? They aren't told.`)) {
      run(() => followsStore.removeFollower(f.uuid))
    }
  }
  const unfollow = (f: FollowView) => {
    const question = f.accepted_at ? `Stop following ${f.username}?` : `Take back your request to ${f.username}?`
    if (confirm(question)) {
      run(async () => {
        await followsStore.unfollow(f.uuid)
        await followsStore.loadFollows()
      })
    }
  }
  const since = (date: string) =>
    new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date))
</script>

<template>
  <v-container class="followers">
    <h5 class="text-h5 mb-4">Followers</h5>
    <v-alert v-if="error" class="mb-4" type="error" variant="tonal">{{ error }}</v-alert>
    <template v-if="follows">
      <v-switch
        color="primary"
        :disabled="busy"
        hint="Off: anyone follows you at once, and the requests waiting are accepted"
        inset
        label="Accept each follower"
        :model-value="follows.approval"
        persistent-hint
        @update:model-value="setApproval"
      />
      <p class="text-body-2 text-medium-emphasis mt-4 mb-4">
        Your followers see your activities not private in their feed. The private ones stay yours only.
      </p>

      <v-card v-if="requests.length > 0" class="mb-4">
        <v-card-title>Requests</v-card-title>
        <v-list>
          <v-list-item
            v-for="f in requests"
            :key="f.uuid"
            :subtitle="`asked on ${since(f.created_at)}`"
            :title="f.username"
            :to="`/athletes/${f.uuid}`"
          >
            <template #append>
              <v-btn
                class="mr-2"
                color="primary"
                :disabled="busy"
                :prepend-icon="mdiCheck"
                size="small"
                @click.stop.prevent="run(() => followsStore.accept(f.uuid))"
              >Accept</v-btn>
              <v-btn
                :disabled="busy"
                :prepend-icon="mdiClose"
                size="small"
                variant="tonal"
                @click.stop.prevent="run(() => followsStore.removeFollower(f.uuid))"
              >Refuse</v-btn>
            </template>
          </v-list-item>
        </v-list>
      </v-card>

      <v-card class="mb-4">
        <v-card-title>Your followers ({{ followers.length }})</v-card-title>
        <v-card-text v-if="followers.length === 0" class="text-medium-emphasis">Nobody follows you yet.</v-card-text>
        <v-list v-else>
          <v-list-item
            v-for="f in followers"
            :key="f.uuid"
            :subtitle="`since ${since(f.accepted_at!)}`"
            :title="f.username"
            :to="`/athletes/${f.uuid}`"
          >
            <template #append>
              <v-btn
                density="comfortable"
                :disabled="busy"
                :icon="mdiAccountRemove"
                size="small"
                title="Remove this follower"
                variant="text"
                @click.stop.prevent="remove(f)"
              />
            </template>
          </v-list-item>
        </v-list>
      </v-card>

      <v-card>
        <v-card-title>You follow ({{ follows.following.length }})</v-card-title>
        <v-card-text v-if="follows.following.length === 0" class="text-medium-emphasis">
          Nobody yet: <router-link to="/athletes">find athletes</router-link>.
        </v-card-text>
        <v-list v-else>
          <v-list-item
            v-for="f in follows.following"
            :key="f.uuid"
            :subtitle="f.accepted_at ? `since ${since(f.accepted_at)}` : 'request waiting'"
            :title="f.username"
            :to="`/athletes/${f.uuid}`"
          >
            <template #append>
              <v-btn
                :disabled="busy"
                size="small"
                variant="tonal"
                @click.stop.prevent="unfollow(f)"
              >{{ f.accepted_at ? 'Unfollow' : 'Take back' }}</v-btn>
            </template>
          </v-list-item>
        </v-list>
      </v-card>
    </template>
  </v-container>
</template>

<style scoped lang="sass">
.followers
  max-width: 760px
</style>
