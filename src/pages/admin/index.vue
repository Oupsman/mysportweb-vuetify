<script setup lang="ts">
  import { computed } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { mdiAccountMultiple, mdiPulse } from '@mdi/js'
  import AdminInvitations from '@/components/AdminInvitations.vue'
  import AdminStatus from '@/components/AdminStatus.vue'
  import AdminUsers from '@/components/AdminUsers.vue'
  import { useUserStore } from '@/stores/user'

  // the backend opens the admin pages to the sessions opened with the two-factor authentication only
  const userStore = useUserStore()
  const verified = computed(() => userStore.session?.mfa === true)
  const hasTwoFactor = computed(() => userStore.session?.two_factor === true)

  // the tab in the address (?tab=status): kept on a reload, and a link opens it
  const route = useRoute()
  const router = useRouter()
  const tabs = ['users', 'status'] as const
  type Tab = typeof tabs[number]
  const tab = computed<Tab>({
    get: () => (tabs as readonly string[]).includes(String(route.query.tab)) ? route.query.tab as Tab : 'users',
    set: value => router.replace({ query: { ...route.query, tab: value } }),
  })
</script>

<template>
  <v-container>
    <v-alert v-if="!verified" type="warning" variant="tonal">
      <template v-if="hasTwoFactor">
        This session was opened before your two-factor authentication: log out, and log in again with a code of
        your authenticator app.
      </template>
      <template v-else>
        The admin pages need the two-factor authentication: set it up in
        <router-link to="/profile/view">your profile</router-link> first.
      </template>
    </v-alert>
    <template v-else>
      <v-tabs v-model="tab" class="mb-4" color="primary">
        <v-tab :prepend-icon="mdiAccountMultiple" value="users">Users</v-tab>
        <v-tab :prepend-icon="mdiPulse" value="status">Status</v-tab>
      </v-tabs>
      <!-- only the tab shown: the status stops refreshing on the users -->
      <template v-if="tab === 'users'">
        <AdminUsers />
        <AdminInvitations class="mt-6" />
      </template>
      <AdminStatus v-else />
    </template>
  </v-container>
</template>
