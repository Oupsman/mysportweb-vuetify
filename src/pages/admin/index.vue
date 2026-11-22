<script setup lang="ts">
  import { computed } from 'vue'
  import AdminInvitations from '@/components/AdminInvitations.vue'
  import AdminUsers from '@/components/AdminUsers.vue'
  import { useUserStore } from '@/stores/user'

  // the backend opens the admin pages to the sessions opened with the two-factor authentication only
  const userStore = useUserStore()
  const verified = computed(() => userStore.session?.mfa === true)
  const hasTwoFactor = computed(() => userStore.session?.two_factor === true)
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
      <AdminUsers />
      <AdminInvitations class="mt-6" />
    </template>
  </v-container>
</template>
