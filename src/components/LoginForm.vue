<script setup lang="ts">
  import { useUserStore } from '@/stores/user'

  const userStore = useUserStore()

  const username: Ref<string> = ref('')
  const password: Ref<string> = ref('')

  const error: Ref<string> = ref('')

  const login = async () => {
    error.value = ''
    try {
      await userStore.login(username.value, password.value)
    } catch {
      error.value = 'Wrong username or password'
    }
  }
</script>

<template>
  <v-container>
    <v-card>
      <v-card-title>Login</v-card-title>
      <v-card-text>
        <v-alert v-if="error" class="mb-4" type="error">{{ error }}</v-alert>
        <v-form @submit.prevent="login">
          <v-text-field
            v-model="username"
            autofocus
            label="Username"
            type="text"
          />
          <v-text-field
            v-model="password"
            label="Password"
            type="password"
          />
          <v-btn color="primary" type="submit">Login</v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<style scoped lang="sass">

</style>
