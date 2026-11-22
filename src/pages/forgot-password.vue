<script setup lang="ts">
  import { ref } from 'vue'
  import { useAccountStore } from '@/stores/account'

  const accountStore = useAccountStore()
  const login = ref('')
  const busy = ref(false)
  const error = ref('')
  // the backend answers the same whatever the account: it doesn't tell which exist
  const answer = ref('')

  const send = async () => {
    error.value = ''
    busy.value = true
    try {
      answer.value = (await accountStore.forgotPassword(login.value.trim())).message
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      busy.value = false
    }
  }
</script>

<template>
  <v-container max-width="560">
    <h1 class="text-h4 mb-4">Forgot your password?</h1>
    <v-alert v-if="answer" type="success" variant="tonal">
      {{ answer.charAt(0).toUpperCase() + answer.slice(1) }}. The link is valid for 24 hours. Nothing in your
      mailbox? Check the spam folder, or ask an admin of the instance.
    </v-alert>
    <v-card v-else>
      <v-card-text>
        <p class="mb-4">
          Enter your username or your email address: a link to choose a new password goes to your confirmed
          address.
        </p>
        <v-alert v-if="error" class="mb-4" type="error">{{ error }}</v-alert>
        <v-form @submit.prevent="send">
          <v-text-field v-model="login" autocomplete="username" autofocus label="Username or email" />
          <v-btn color="primary" :disabled="!login.trim()" :loading="busy" type="submit">Send the link</v-btn>
        </v-form>
      </v-card-text>
    </v-card>
    <p class="mt-4"><router-link to="/login">Back to the login</router-link></p>
  </v-container>
</template>
