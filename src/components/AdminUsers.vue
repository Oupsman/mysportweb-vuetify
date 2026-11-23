<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import {
    mdiAccountCancelOutline, mdiAccountCheckOutline, mdiCheck, mdiContentCopy, mdiDatabaseOutline, mdiDeleteOutline,
    mdiKeyChainVariant, mdiShieldAccountOutline, mdiShieldCheckOutline,
  } from '@mdi/js'
  import { useAccountStore } from '@/stores/account'
  import { useUserStore } from '@/stores/user'
  import type { AdminUser } from '@/types/user'
  import { formatDate } from '@/utils/format'

  const accountStore = useAccountStore()
  const userStore = useUserStore()
  const isLoading = ref(true)
  const error = ref('')

  const load = async () => {
    try {
      await accountStore.getUsers()
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      isLoading.value = false
    }
  }
  onMounted(load)
  onMounted(() => userStore.loadInstance().catch(() => {}))

  // the emails: a test to the admin, the error of the server shown
  const testing = ref(false)
  const testResult = ref<{ ok: boolean, text: string } | null>(null)
  const testEmail = async () => {
    testing.value = true
    try {
      const answer = await accountStore.sendTestEmail()
      testResult.value = { ok: true, text: `Sent to ${answer.sent_to}: check it arrived, and not in the spam folder.` }
    } catch (e) {
      testResult.value = { ok: false, text: (e as Error).message }
    } finally {
      testing.value = false
    }
  }

  const size = (bytes: number): string => {
    if (bytes < 1 << 20) return `${Math.round(bytes / 1024)} KB`
    if (bytes < 1 << 30) return `${(bytes / (1 << 20)).toFixed(1)} MB`
    return `${(bytes / (1 << 30)).toFixed(2)} GB`
  }
  const isMe = (u: AdminUser) => u.id === userStore.session?.sub
  // the share of their quota their files take, null without quota
  const usage = (u: AdminUser): number | null => u.quota > 0 ? Math.min(100, (u.disk_bytes / u.quota) * 100) : null
  const usageColor = (percent: number) => percent >= 100 ? 'error' : percent >= 90 ? 'warning' : 'primary'

  // each action asks a code of the authenticator app: the dialog says what it does
  type Action = { user: AdminUser, kind: 'promote' | 'demote' | 'disable' | 'enable' | 'delete' | 'reset' | 'quota' }
  const pending = ref<Action | null>(null)
  const code = ref('')
  const confirmName = ref('')
  const busy = ref(false)
  const actionError = ref('')
  const resetLink = ref<{ user: string, link: string, expires_at: string } | null>(null)
  // the quota dialog: the one of the instance, their own (GB), or none
  const quotaMode = ref<'instance' | 'own' | 'none'>('instance')
  const quotaGB = ref('')
  const quotaValid = computed(() => quotaMode.value !== 'own' ||
    (/^\d+(\.\d+)?$/.test(quotaGB.value.trim()) && Number(quotaGB.value) > 0))
  const copied = ref(false)

  const describe: Record<Action['kind'], (u: AdminUser) => { title: string, text: string, color: string }> = {
    promote: u => ({ title: `Make ${u.username} an admin`, text: 'They will manage the users and the invitations, once they set up their two-factor authentication.', color: 'primary' }),
    demote: u => ({ title: `Make ${u.username} a user`, text: 'They lose access to the admin pages at once.', color: 'primary' }),
    disable: u => ({ title: `Disable ${u.username}`, text: 'They can\'t log in anymore, their sessions and device tokens stop working at once. Their data is kept.', color: 'warning' }),
    enable: u => ({ title: `Enable ${u.username}`, text: 'They can log in again.', color: 'primary' }),
    delete: u => ({ title: `Delete ${u.username}`, text: 'Their activities, files, health data, equipment, devices and segments are deleted, for good.', color: 'error' }),
    reset: u => ({ title: `Password reset link for ${u.username}`, text: 'A link valid 24 hours, used once, to choose a new password. Give it to them: it is shown once. Their two-factor authentication stays.', color: 'primary' }),
    quota: u => ({ title: `Storage quota of ${u.username}`, text: `Their files take ${size(u.disk_bytes)}. Above the quota, their uploads are refused; nothing is deleted.`, color: 'primary' }),
  }
  const details = computed(() => pending.value ? describe[pending.value.kind](pending.value.user) : null)
  const ask = (user: AdminUser, kind: Action['kind']) => {
    pending.value = { user, kind }
    code.value = ''
    confirmName.value = ''
    actionError.value = ''
    if (kind === 'quota') {
      quotaMode.value = user.quota_bytes === null ? 'instance' : user.quota_bytes === 0 ? 'none' : 'own'
      quotaGB.value = user.quota_bytes ? String(Math.round((user.quota_bytes / (1 << 30)) * 100) / 100) : ''
    }
  }
  const ready = computed(() => code.value.trim().length === 6 &&
    (pending.value?.kind !== 'delete' || confirmName.value === pending.value.user.username) &&
    (pending.value?.kind !== 'quota' || quotaValid.value))

  const run = async () => {
    const action = pending.value
    if (!action) return
    actionError.value = ''
    busy.value = true
    try {
      const { user, kind } = action
      switch (kind) {
        case 'promote':
        case 'demote':
          await accountStore.setRole(user.id, kind === 'promote' ? 'Admin' : 'User', code.value.trim())
          break
        case 'disable':
        case 'enable':
          await accountStore.setDisabled(user.id, kind === 'disable', code.value.trim())
          break
        case 'delete':
          await accountStore.deleteUser(user.id, code.value.trim())
          break
        case 'quota': {
          const bytes = quotaMode.value === 'instance' ? null
            : quotaMode.value === 'none' ? 0 : Math.round(Number(quotaGB.value) * (1 << 30))
          await accountStore.setQuota(user.id, bytes, code.value.trim())
          break
        }
        case 'reset': {
          const answer = await accountStore.passwordResetLink(user.id, code.value.trim())
          resetLink.value = { user: user.username, ...answer }
          copied.value = false
          break
        }
      }
      pending.value = null
      await accountStore.getUsers()
    } catch (e) {
      actionError.value = (e as Error).message
    } finally {
      busy.value = false
    }
  }
  const copyLink = async () => {
    if (!resetLink.value) return
    await navigator.clipboard.writeText(resetLink.value.link)
    copied.value = true
  }
</script>

<template>
  <v-card>
    <v-card-item>
      <v-card-title>Users</v-card-title>
      <v-card-subtitle>Each change asks a code of your authenticator app</v-card-subtitle>
      <template v-if="userStore.instance?.email" #append>
        <v-btn :loading="testing" size="small" variant="outlined" @click="testEmail">Send a test email</v-btn>
      </template>
    </v-card-item>
    <v-card-text>
      <v-alert v-if="error" class="mb-4" type="error">{{ error }}</v-alert>
      <v-alert
        v-if="testResult"
        class="mb-4"
        closable
        :type="testResult.ok ? 'success' : 'error'"
        variant="tonal"
        @click:close="testResult = null"
      >{{ testResult.text }}</v-alert>
      <v-alert
        v-if="resetLink"
        class="mb-4"
        closable
        :title="`Give this link to ${resetLink.user} now`"
        type="success"
        variant="tonal"
        @click:close="resetLink = null"
      >
        <p class="mb-2">Valid until {{ formatDate(resetLink.expires_at) }}, used once. It is shown only now.</p>
        <code class="link">{{ resetLink.link }}</code>
        <div class="mt-2">
          <v-btn :prepend-icon="copied ? mdiCheck : mdiContentCopy" size="small" variant="outlined" @click="copyLink">
            {{ copied ? 'Copied' : 'Copy' }}
          </v-btn>
        </div>
      </v-alert>
      <v-progress-linear v-if="isLoading" indeterminate />
      <v-table v-else density="compact">
        <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th class="d-none d-md-table-cell">Since</th>
            <th class="text-right">Activities</th>
            <th class="d-none d-md-table-cell">Last activity</th>
            <th class="text-right d-none d-sm-table-cell">Files</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in accountStore.users" :key="u.id" :class="{ 'text-disabled': u.disabled_at }">
            <td>
              <div class="font-weight-medium">
                {{ u.username }}
                <v-icon v-if="u.two_factor" :icon="mdiShieldCheckOutline" size="small" title="Two-factor authentication on" />
                <v-chip v-if="u.disabled_at" class="ml-1" color="warning" size="x-small">Disabled</v-chip>
              </div>
              <div class="text-caption text-medium-emphasis">{{ u.email }}</div>
            </td>
            <td>{{ u.role }}</td>
            <td class="d-none d-md-table-cell">{{ formatDate(u.created_at) }}</td>
            <td class="text-right">{{ u.activities }}</td>
            <td class="d-none d-md-table-cell">{{ u.last_activity ? formatDate(u.last_activity) : '' }}</td>
            <td class="text-right text-no-wrap d-none d-sm-table-cell">
              {{ size(u.disk_bytes) }}
              <span class="text-medium-emphasis">/ {{ u.quota > 0 ? size(u.quota) : 'no quota' }}</span>
              <v-progress-linear
                v-if="usage(u) !== null"
                class="mt-1"
                :color="usageColor(usage(u)!)"
                height="4"
                :model-value="usage(u)!"
                rounded
                :title="u.quota_bytes === null ? 'The quota of the instance' : 'A quota of their own'"
              />
            </td>
            <td class="text-right text-no-wrap">
              <v-btn
                :icon="mdiDatabaseOutline"
                size="small"
                title="Storage quota"
                variant="text"
                @click="ask(u, 'quota')"
              />
              <template v-if="!isMe(u)">
                <v-btn
                  :icon="mdiShieldAccountOutline"
                  size="small"
                  :title="u.role === 'Admin' ? 'Make them a user' : 'Make them an admin'"
                  variant="text"
                  @click="ask(u, u.role === 'Admin' ? 'demote' : 'promote')"
                />
                <v-btn
                  :icon="mdiKeyChainVariant"
                  size="small"
                  title="Password reset link"
                  variant="text"
                  @click="ask(u, 'reset')"
                />
                <v-btn
                  :icon="u.disabled_at ? mdiAccountCheckOutline : mdiAccountCancelOutline"
                  size="small"
                  :title="u.disabled_at ? 'Enable' : 'Disable'"
                  variant="text"
                  @click="ask(u, u.disabled_at ? 'enable' : 'disable')"
                />
                <v-btn
                  color="error"
                  :disabled="!u.disabled_at"
                  :icon="mdiDeleteOutline"
                  size="small"
                  :title="u.disabled_at ? 'Delete' : 'Disable the account before deleting it'"
                  variant="text"
                  @click="ask(u, 'delete')"
                />
              </template>
              <span v-else class="text-caption text-medium-emphasis">You</span>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>

    <v-dialog max-width="500" :model-value="pending !== null" @update:model-value="v => { if (!v) pending = null }">
      <v-card v-if="pending && details" :title="details.title">
        <v-card-text>
          <p class="mb-4">{{ details.text }}</p>
          <v-alert v-if="actionError" class="mb-4" type="error">{{ actionError }}</v-alert>
          <template v-if="pending.kind === 'quota'">
            <v-radio-group v-model="quotaMode" density="compact" hide-details>
              <v-radio label="The quota of the instance (MSW_USER_QUOTA)" value="instance" />
              <v-radio label="A quota of their own" value="own" />
              <v-radio label="No quota" value="none" />
            </v-radio-group>
            <v-text-field
              v-if="quotaMode === 'own'"
              v-model="quotaGB"
              class="mt-2"
              inputmode="decimal"
              label="Quota"
              :rules="[() => quotaValid || 'A number of GB above 0']"
              suffix="GB"
            />
          </template>
          <v-text-field
            v-if="pending.kind === 'delete'"
            v-model="confirmName"
            autocomplete="off"
            :label="`Type ${pending.user.username} to confirm`"
          />
          <v-text-field
            v-model="code"
            autocomplete="one-time-code"
            autofocus
            inputmode="numeric"
            label="Code of your authenticator app"
            maxlength="6"
            @keyup.enter="ready && run()"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="pending = null">Cancel</v-btn>
          <v-btn :color="details.color" :disabled="!ready" :loading="busy" @click="run">Confirm</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<style scoped>
.link {
  word-break: break-all;
}
</style>
