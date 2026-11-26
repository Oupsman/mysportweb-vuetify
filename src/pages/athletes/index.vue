<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { mdiAccountMultiple, mdiMagnify } from '@mdi/js'
  import FollowButton from '@/components/FollowButton.vue'
  import { useFollowsStore } from '@/stores/follows'
  import type { UserCard } from '@/types/follows'

  // the users of the instance, found by their username, to follow
  const followsStore = useFollowsStore()
  const q = ref('')
  const users = ref<UserCard[]>([])
  const searched = ref(false)
  const loading = ref(false)
  const error = ref('')

  let typing: ReturnType<typeof setTimeout> | undefined
  watch(q, value => {
    clearTimeout(typing)
    const text = value.trim()
    if (text.length < 2) {
      users.value = []
      searched.value = false
      return
    }
    typing = setTimeout(async () => {
      loading.value = true
      error.value = ''
      try {
        users.value = await followsStore.search(text)
        searched.value = true
      } catch (e) {
        error.value = (e as Error).message
      } finally {
        loading.value = false
      }
    }, 300)
  })
</script>

<template>
  <v-container class="athletes">
    <div class="d-flex align-center mb-4">
      <h5 class="text-h5">Athletes</h5>
      <v-spacer />
      <v-btn :prepend-icon="mdiAccountMultiple" to="/followers" variant="tonal">Your followers</v-btn>
    </div>
    <v-text-field
      v-model="q"
      autofocus
      clearable
      hint="2 characters at least of a username"
      label="Search"
      :loading="loading"
      :prepend-inner-icon="mdiMagnify"
    />
    <v-alert v-if="error" class="mb-4" type="error" variant="tonal">{{ error }}</v-alert>
    <p v-if="searched && users.length === 0" class="text-medium-emphasis">Nobody matches.</p>
    <v-list v-if="users.length > 0">
      <v-list-item v-for="user in users" :key="user.uuid" :title="user.username" :to="`/athletes/${user.uuid}`">
        <template #append>
          <FollowButton
            v-model:state="user.state"
            :username="user.username"
            :uuid="user.uuid"
            @error="error = $event"
          />
        </template>
      </v-list-item>
    </v-list>
  </v-container>
</template>

<style scoped lang="sass">
.athletes
  max-width: 760px
</style>
