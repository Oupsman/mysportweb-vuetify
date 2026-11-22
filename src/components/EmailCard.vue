<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { mdiEmailAlertOutline, mdiEmailCheckOutline } from '@mdi/js'
  import { useAccountStore } from '@/stores/account'

  // the address of the user: its confirmation, and the notifications by email
  const accountStore = useAccountStore()
  const status = computed(() => accountStore.emailStatus)
  const error = ref('')
  const info = ref('')
  const busy = ref(false)
  const notify = ref(false)
  const notifyAvailable = ref(false)

  const load = async () => {
    try {
      await accountStore.getEmailStatus()
      const n = await accountStore.getEmailNotifications()
      notify.value = n.enabled
      notifyAvailable.value = n.available
    } catch (e) {
      error.value = (e as Error).message
    }
  }
  onMounted(load)

  const run = async (action: () => Promise<void>) => {
    error.value = ''
    info.value = ''
    busy.value = true
    try {
      await action()
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      busy.value = false
    }
  }
  const resend = () => run(async () => {
    const answer = await accountStore.resendVerification()
    info.value = `A confirmation is on its way to ${answer.sent_to}: open its link.`
  })
  const setNotify = (on: boolean | null) => run(async () => {
    await accountStore.setEmailNotifications(!!on)
    notify.value = !!on
  })
</script>

<template>
  <v-card v-if="status">
    <v-card-item>
      <v-card-title>Email</v-card-title>
      <v-card-subtitle>{{ status.email }}</v-card-subtitle>
      <template #append>
        <v-chip
          :color="status.verified_at ? 'success' : 'warning'"
          :prepend-icon="status.verified_at ? mdiEmailCheckOutline : mdiEmailAlertOutline"
          size="small"
        >
          {{ status.verified_at ? 'Confirmed' : 'Not confirmed' }}
        </v-chip>
      </template>
    </v-card-item>
    <v-card-text>
      <v-alert
        v-if="error"
        class="mb-4"
        closable
        type="error"
        @click:close="error = ''"
      >{{ error }}</v-alert>
      <v-alert
        v-if="info"
        class="mb-4"
        closable
        type="success"
        variant="tonal"
        @click:close="info = ''"
      >{{ info }}</v-alert>
      <template v-if="!status.enabled">
        <p class="text-medium-emphasis">This instance sends no email: an admin gives the reset links by hand.</p>
      </template>
      <template v-else>
        <p v-if="status.pending" class="mb-3">
          You change it to <strong>{{ status.pending }}</strong>: open the link sent there to confirm it. The current
          one is used meanwhile.
        </p>
        <p v-else-if="!status.verified_at" class="mb-3">
          Confirm it to receive the links of a forgotten password, and the notifications you choose.
        </p>
        <v-btn
          v-if="status.pending || !status.verified_at"
          class="mb-4"
          :loading="busy"
          variant="outlined"
          @click="resend"
        >Send the confirmation again</v-btn>
        <v-switch
          color="primary"
          :disabled="busy || (!notifyAvailable && !notify)"
          hide-details
          :hint="notifyAvailable ? '' : 'Confirm your address first'"
          label="Notifications by email too (service due...)"
          :model-value="notify"
          persistent-hint
          @update:model-value="setNotify"
        />
      </template>
    </v-card-text>
  </v-card>
</template>
