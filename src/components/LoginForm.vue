<script setup lang="ts">
  import { useUserStore } from '@/stores/user'

  const userStore = useUserStore()
  const route = useRoute()

  const username: Ref<string> = ref('')
  const password: Ref<string> = ref('')
  // the second step, with the two-factor authentication: the challenge of the first one, and a code
  const challenge: Ref<string | null> = ref(null)
  const code: Ref<string> = ref('')
  const busy = ref(false)

  const error: Ref<string> = ref('')

  const login = async () => {
    error.value = ''
    busy.value = true
    try {
      challenge.value = await userStore.login(username.value, password.value, route.query.redirect)
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      busy.value = false
    }
  }

  const verify = async () => {
    if (!challenge.value) return
    error.value = ''
    busy.value = true
    try {
      await userStore.loginSecondFactor(challenge.value, code.value, route.query.redirect)
    } catch (e) {
      error.value = (e as Error).message
      // the challenge lasts 5 minutes: after, the login starts again
      if (/expired/.test(error.value)) {
        challenge.value = null
        code.value = ''
      }
    } finally {
      busy.value = false
    }
  }
</script>

<template>
  <v-container>
    <v-card>
      <v-card-title>Login</v-card-title>
      <v-card-text>
        <v-alert v-if="error" class="mb-4" type="error">{{ error }}</v-alert>
        <v-form v-if="!challenge" @submit.prevent="login">
          <v-text-field
            v-model="username"
            autocomplete="username"
            autofocus
            label="Username"
            type="text"
          />
          <v-text-field
            v-model="password"
            autocomplete="current-password"
            label="Password"
            type="password"
          />
          <v-btn color="primary" :loading="busy" type="submit">Login</v-btn>
        </v-form>
        <v-form v-else @submit.prevent="verify">
          <p class="mb-4">Enter the code of your authenticator app, or one of your recovery codes.</p>
          <v-text-field
            v-model="code"
            autocomplete="one-time-code"
            autofocus
            inputmode="numeric"
            label="Code"
            maxlength="11"
          />
          <div class="d-flex ga-2">
            <v-btn color="primary" :disabled="!code.trim()" :loading="busy" type="submit">Verify</v-btn>
            <v-btn variant="text" @click="challenge = null; code = ''">Back</v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>
