<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { mdiDeleteForeverOutline, mdiDownload } from '@mdi/js'
  import { useAccountStore } from '@/stores/account'
  import { useUserStore } from '@/stores/user'

  const accountStore = useAccountStore()
  const userStore = useUserStore()

  // the deletion: the password, the username typed again, and a code with the two-factor authentication
  const dialog = ref(false)
  const password = ref('')
  const username = ref('')
  const code = ref('')
  const busy = ref(false)
  const error = ref('')
  const twoFactor = computed(() => userStore.session?.two_factor ?? false)
  const name = computed(() => (userStore.user as { username?: string }).username ?? '')
  const canDelete = computed(() => password.value && username.value === name.value && (!twoFactor.value || code.value.trim()))

  const open = async () => {
    password.value = ''
    username.value = ''
    code.value = ''
    error.value = ''
    if (!name.value) await userStore.getUser().catch(() => {})
    dialog.value = true
  }
  const remove = async () => {
    error.value = ''
    busy.value = true
    try {
      await accountStore.deleteAccount(password.value, username.value, code.value)
      dialog.value = false
      // the backend ended the session with the account
      userStore.setUserSession(null)
      window.location.assign('/')
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      busy.value = false
    }
  }
</script>

<template>
  <v-card>
    <v-card-item>
      <v-card-title>Your data</v-card-title>
      <v-card-subtitle>Everything this app keeps about you</v-card-subtitle>
    </v-card-item>
    <v-card-text>
      <p class="mb-3">
        The export is a zip of your uploaded files and of everything computed from them, as JSON. It can take
        a while with many activities: it downloads as it is made.
      </p>
      <div class="d-flex flex-wrap ga-2">
        <v-btn :href="accountStore.exportUrl" :prepend-icon="mdiDownload" variant="outlined">Export my data</v-btn>
        <v-btn color="error" :prepend-icon="mdiDeleteForeverOutline" variant="text" @click="open">
          Delete my account
        </v-btn>
      </div>
    </v-card-text>

    <v-dialog v-model="dialog" max-width="520">
      <v-card title="Delete your account">
        <v-card-text>
          <v-alert class="mb-4" type="error" variant="tonal">
            Your activities, files, health data, equipment, devices and segments are deleted, for good. Export
            your data first to keep them.
          </v-alert>
          <v-alert v-if="error" class="mb-4" type="error">{{ error }}</v-alert>
          <v-text-field v-model="password" autocomplete="current-password" label="Your password" type="password" />
          <v-text-field v-model="username" autocomplete="off" :label="`Type your username, ${name}, to confirm`" />
          <v-text-field
            v-if="twoFactor"
            v-model="code"
            autocomplete="one-time-code"
            inputmode="numeric"
            label="Code of your authenticator app, or a recovery code"
            maxlength="11"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
          <v-btn color="error" :disabled="!canDelete" :loading="busy" @click="remove">Delete everything</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>
