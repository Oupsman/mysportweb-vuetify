<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { mdiShieldCheckOutline, mdiShieldOffOutline } from '@mdi/js'
  import RecoveryCodes from '@/components/RecoveryCodes.vue'
  import { useAccountStore } from '@/stores/account'
  import { useUserStore } from '@/stores/user'
  import type { TwoFactorSetup } from '@/types/user'
  import { formatDate } from '@/utils/format'

  const accountStore = useAccountStore()
  const userStore = useUserStore()
  const status = computed(() => accountStore.twoFactor)
  const error = ref('')
  const busy = ref(false)

  onMounted(() => accountStore.getTwoFactor().catch(e => { error.value = (e as Error).message }))

  // the setup: the password, then the QR code and a code of the app, then the recovery codes
  const step = ref<'idle' | 'password' | 'scan'>('idle')
  const password = ref('')
  const code = ref('')
  const setup = ref<TwoFactorSetup | null>(null)
  const recoveryCodes = ref<string[]>([])

  const run = async (action: () => Promise<void>) => {
    error.value = ''
    busy.value = true
    try {
      await action()
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      busy.value = false
    }
  }
  const start = () => run(async () => {
    setup.value = await accountStore.setupTwoFactor(password.value)
    password.value = ''
    code.value = ''
    step.value = 'scan'
  })
  const confirm = () => run(async () => {
    const answer = await accountStore.enableTwoFactor(code.value)
    recoveryCodes.value = answer.recovery_codes
    step.value = 'idle'
    setup.value = null
    // the session of the page is a verified one now: the admin pages open
    userStore.setUserSession(answer.session)
    await accountStore.getTwoFactor()
  })

  // the other actions: the password and a code
  const action = ref<'disable' | 'recovery' | null>(null)
  const submitAction = () => run(async () => {
    if (action.value === 'disable') {
      await accountStore.disableTwoFactor(password.value, code.value)
    } else {
      recoveryCodes.value = (await accountStore.newRecoveryCodes(password.value, code.value)).recovery_codes
    }
    action.value = null
    password.value = ''
    code.value = ''
    await accountStore.getTwoFactor()
  })
</script>

<template>
  <v-card>
    <v-card-item>
      <v-card-title>Two-factor authentication</v-card-title>
      <v-card-subtitle>A code of an authenticator app at each login, besides your password</v-card-subtitle>
      <template #append>
        <v-chip
          v-if="status"
          :color="status.enabled ? 'success' : (status.required ? 'error' : undefined)"
          :prepend-icon="status.enabled ? mdiShieldCheckOutline : mdiShieldOffOutline"
          size="small"
        >
          {{ status.enabled ? 'On' : 'Off' }}
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
      <RecoveryCodes v-if="recoveryCodes.length" :codes="recoveryCodes" />

      <template v-if="status && !status.enabled">
        <v-alert v-if="status.required" class="mb-4" type="warning" variant="tonal">
          As an admin, you need it: the admin pages stay closed until it is set up.
        </v-alert>
        <template v-if="step === 'idle'">
          <p class="mb-3">
            Use an authenticator app on your phone (Aegis, 2FAS, Google Authenticator, a password manager...).
          </p>
          <v-btn color="primary" @click="step = 'password'">Set it up</v-btn>
        </template>
        <v-form v-else-if="step === 'password'" @submit.prevent="start">
          <v-text-field
            v-model="password"
            autocomplete="current-password"
            autofocus
            label="Your password"
            type="password"
          />
          <div class="d-flex ga-2">
            <v-btn color="primary" :disabled="!password" :loading="busy" type="submit">Continue</v-btn>
            <v-btn variant="text" @click="step = 'idle'">Cancel</v-btn>
          </div>
        </v-form>
        <v-form v-else-if="setup" @submit.prevent="confirm">
          <p class="mb-2">Scan this QR code with your authenticator app, then enter the code it shows.</p>
          <v-img alt="QR code of the secret" class="mb-2" max-width="240" :src="setup.qr_code" />
          <p class="text-caption mb-4">
            Or enter this key in the app: <code class="secret">{{ setup.secret }}</code>
          </p>
          <v-text-field
            v-model="code"
            autocomplete="one-time-code"
            autofocus
            inputmode="numeric"
            label="Code of the app"
            maxlength="6"
          />
          <div class="d-flex ga-2">
            <v-btn color="primary" :disabled="code.trim().length !== 6" :loading="busy" type="submit">Turn on</v-btn>
            <v-btn variant="text" @click="step = 'idle'; setup = null">Cancel</v-btn>
          </div>
        </v-form>
      </template>

      <template v-else-if="status">
        <p class="mb-3">
          On since {{ status.enabled_at ? formatDate(status.enabled_at) : '' }}.
          {{ status.recovery_codes_left }} recovery codes left.
        </p>
        <div v-if="!action" class="d-flex flex-wrap ga-2">
          <v-btn variant="outlined" @click="action = 'recovery'">New recovery codes</v-btn>
          <v-btn
            v-if="!status.required"
            color="error"
            variant="text"
            @click="action = 'disable'"
          >Turn off</v-btn>
        </div>
        <v-form v-else @submit.prevent="submitAction">
          <v-text-field v-model="password" autocomplete="current-password" label="Your password" type="password" />
          <v-text-field
            v-model="code"
            autocomplete="one-time-code"
            inputmode="numeric"
            :label="action === 'disable' ? 'Code of the app, or a recovery code' : 'Code of the app'"
            maxlength="11"
          />
          <div class="d-flex ga-2">
            <v-btn
              :color="action === 'disable' ? 'error' : 'primary'"
              :disabled="!password || !code.trim()"
              :loading="busy"
              type="submit"
            >{{ action === 'disable' ? 'Turn off' : 'Create them' }}</v-btn>
            <v-btn variant="text" @click="action = null">Cancel</v-btn>
          </div>
        </v-form>
      </template>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.secret {
  word-break: break-all;
}
</style>
