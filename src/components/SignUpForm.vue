<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import type { Ref } from 'vue'
  import { useRoute } from 'vue-router'
  import { useUserStore } from '@/stores/user'
  import router from '@/router'
  import type { SignupGrant } from '@/types/user'

  const userStore = useUserStore()
  const route = useRoute()

  const username: Ref<string> = ref('')
  const password: Ref<string> = ref('')
  const email: Ref<string> = ref('')
  // the link of an invitation fills it in: /#/signup?invitation=...
  const invitation: Ref<string> = ref(typeof route.query.invitation === 'string' ? route.query.invitation : '')
  const setupCode: Ref<string> = ref('')
  const error: Ref<string> = ref('')
  const loading = ref(true)
  const submitting = ref(false)

  onMounted(async () => {
    try {
      await userStore.loadInstance()
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  })

  const instance = computed(() => userStore.instance)
  // the instance waits for its admin: the form creates it, with the setup code of the backend logs
  const setup = computed(() => instance.value?.setup_required === true)
  const needsInvitation = computed(() => !setup.value && instance.value?.registration === 'invite')
  const closed = computed(() => !setup.value && instance.value?.registration === 'closed')

  const signup = async () => {
    error.value = ''
    const grant: SignupGrant = {}
    if (setup.value) {
      grant.setup_code = setupCode.value.trim()
    } else if (needsInvitation.value) {
      grant.invitation = invitation.value.trim()
    }
    submitting.value = true
    try {
      await userStore.signup(username.value, password.value, email.value, grant)
      router.push('/login')
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      submitting.value = false
    }
  }
</script>

<template>
  <v-container>
    <v-card>
      <v-card-title>{{ setup ? 'Create the admin account' : 'Sign up' }}</v-card-title>
      <v-card-text>
        <v-alert v-if="error" class="mb-4" type="error">{{ error }}</v-alert>
        <div v-if="loading">Loading...</div>
        <v-alert v-else-if="closed" type="info" variant="tonal">
          The registrations are closed on this instance. Ask its admin for an account.
        </v-alert>
        <v-form v-else-if="instance" @submit.prevent="signup">
          <v-alert v-if="setup" class="mb-4" type="info" variant="tonal">
            This instance has no admin yet. The setup code is in the logs of the backend
            (<code>docker compose logs backend | grep setup_code</code>); a new one is drawn at each start.
          </v-alert>
          <v-text-field
            v-if="setup"
            v-model="setupCode"
            autocomplete="off"
            label="Setup code"
            type="text"
          />
          <v-text-field
            v-if="needsInvitation"
            v-model="invitation"
            autocomplete="off"
            hint="The code of the invitation an admin sent you"
            label="Invitation"
            persistent-hint
            type="text"
          />
          <v-text-field
            v-model="username"
            autocomplete="username"
            autofocus
            label="Username"
            type="text"
          />
          <v-text-field
            v-model="password"
            autocomplete="new-password"
            label="Password"
            type="password"
          />
          <v-text-field
            v-model="email"
            autocomplete="email"
            label="Email"
            type="email"
          />
          <v-btn color="primary" :loading="submitting" type="submit">{{ setup ? 'Create the admin' : 'Sign up' }}</v-btn>
        </v-form>
      </v-card-text>
    </v-card>

  </v-container>
</template>

<style scoped lang="sass">

</style>
