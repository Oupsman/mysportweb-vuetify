<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import { useAccountStore } from '@/stores/account'

  // the link of the confirmation email: /verify-email?code=...
  const route = useRoute()
  const accountStore = useAccountStore()
  const code = computed(() => typeof route.query.code === 'string' ? route.query.code : '')
  const confirmed = ref('')
  const error = ref('')
  const busy = ref(true)

  onMounted(async () => {
    if (!code.value) {
      error.value = 'This link has no code: send a new confirmation from your profile.'
      busy.value = false
      return
    }
    try {
      confirmed.value = (await accountStore.verifyEmail(code.value)).email
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      busy.value = false
    }
  })
</script>

<template>
  <v-container max-width="560">
    <h1 class="text-h4 mb-4">Your email address</h1>
    <v-progress-linear v-if="busy" indeterminate />
    <v-alert v-else-if="confirmed" type="success">
      <strong>{{ confirmed }}</strong> is confirmed: the password resets and the notifications you choose go to it.
    </v-alert>
    <v-alert v-else type="error">{{ error }}</v-alert>
    <p class="mt-4"><router-link to="/">Open MySportWeb</router-link></p>
  </v-container>
</template>
