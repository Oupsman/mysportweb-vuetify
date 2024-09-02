<script setup lang="ts">
  import { ref } from 'vue'
  import type { Ref } from 'vue'
  import { useUserStore } from '@/stores/user'
  import { useAppStore } from '@/stores/app'

  const userStore = useUserStore()
  const appStore = useAppStore()

  const username: Ref<string> = ref('')
  const password: Ref<string> = ref('')

  const login = () => {
    userStore.login(username.value, password.value)
  }
</script>

<template>
  <v-container>
    <v-card>
      <v-card-title>Login</v-card-title>
      <v-card-text>
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
