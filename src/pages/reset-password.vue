<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import { useAccountStore } from '@/stores/account'
  import { minPasswordLength, passwordLengthRule } from '@/utils/password'

  // the link an admin gave: /reset-password?code=...
  const route = useRoute()
  const accountStore = useAccountStore()
  const code = computed(() => typeof route.query.code === 'string' ? route.query.code : '')

  const password = ref('')
  const confirmation = ref('')
  const busy = ref(false)
  const error = ref('')
  const done = ref('')

  const rules = {
    length: passwordLengthRule,
    same: (v: string) => v === password.value || 'The passwords differ',
  }
  const valid = computed(() => password.value.length >= minPasswordLength && password.value === confirmation.value)

  const save = async () => {
    error.value = ''
    busy.value = true
    try {
      done.value = (await accountStore.resetPassword(code.value, password.value)).username
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      busy.value = false
    }
  }
</script>

<template>
  <v-container class="reset" max-width="560">
    <h1 class="text-h4 mb-4">New password</h1>
    <v-alert v-if="!code" type="error">This link has no code: ask an admin for a new one.</v-alert>
    <v-alert v-else-if="done" type="success">
      The password of <strong>{{ done }}</strong> is changed, your other sessions ended.
      <router-link to="/login">Log in</router-link> with it.
    </v-alert>
    <v-card v-else>
      <v-card-text>
        <v-alert v-if="error" class="mb-4" type="error">{{ error }}</v-alert>
        <v-form @submit.prevent="save">
          <v-text-field
            v-model="password"
            autocomplete="new-password"
            autofocus
            label="New password"
            :rules="[rules.length]"
            type="password"
          />
          <v-text-field
            v-model="confirmation"
            autocomplete="new-password"
            label="Confirm the password"
            :rules="[rules.same]"
            type="password"
          />
          <v-btn color="primary" :disabled="!valid" :loading="busy" type="submit">Save</v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>
