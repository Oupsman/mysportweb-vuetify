<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { mdiCheck, mdiContentCopy, mdiDeleteOutline, mdiEmailPlusOutline, mdiPlus } from '@mdi/js'
  import { useInvitationsStore } from '@/stores/invitations'
  import { useUserStore } from '@/stores/user'
  import type { Invitation, NewInvitation } from '@/types/user'
  import { formatDate } from '@/utils/format'

  const invitationsStore = useInvitationsStore()
  const userStore = useUserStore()

  const isLoading = ref(true)
  const error = ref('')
  const revoking = ref(new Set<string>())

  onMounted(async () => {
    try {
      await Promise.all([invitationsStore.getInvitations(), userStore.loadInstance()])
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      isLoading.value = false
    }
  })

  // the invitations only work with REGISTRATION=invite
  const registration = computed(() => userStore.instance?.registration)

  const status = (invitation: Invitation): { text: string, color: string } => {
    if (invitation.used_at) {
      return { text: `Used by ${invitation.used_by}`, color: 'success' }
    }
    if (new Date(invitation.expires_at) <= new Date()) {
      return { text: 'Expired', color: 'error' }
    }
    return { text: `Until ${formatDate(invitation.expires_at)}`, color: 'primary' }
  }

  const durations = [
    { title: '1 day', value: 1 },
    { title: '7 days', value: 7 },
    { title: '30 days', value: 30 },
    { title: '90 days', value: 90 },
  ]

  // creation dialog
  const dialog = ref(false)
  const creating = ref(false)
  const createError = ref('')
  const form = ref({ email: '', days: 7, send: false })

  const openDialog = () => {
    form.value = { email: '', days: 7, send: false }
    createError.value = ''
    dialog.value = true
  }

  // the created invitation, its link shown once
  const created = ref<NewInvitation | null>(null)
  const copied = ref(false)

  const create = async () => {
    creating.value = true
    createError.value = ''
    try {
      created.value = await invitationsStore.createInvitation(form.value.email.trim(), form.value.days,
                                                              form.value.send && form.value.email.trim() !== '')
      copied.value = false
      dialog.value = false
    } catch (e) {
      createError.value = (e as Error).message
    } finally {
      creating.value = false
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(created.value?.link ?? '')
      copied.value = true
    } catch {
      // no clipboard outside https: the field stays selectable
      copied.value = false
    }
  }

  const revoke = async (invitation: Invitation) => {
    if (!confirm(`Revoke the invitation ${invitation.hint}…? Its link won't register anyone.`)) {
      return
    }
    error.value = ''
    revoking.value.add(invitation.id)
    try {
      await invitationsStore.revokeInvitation(invitation.id)
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      revoking.value.delete(invitation.id)
    }
  }
</script>

<template>
  <v-card>
    <v-card-item>
      <v-card-title>Invitations</v-card-title>
      <v-card-subtitle>
        Each invitation registers one account. Send its link to the person you invite.
      </v-card-subtitle>
      <template #append>
        <v-btn color="primary" :prepend-icon="mdiPlus" @click="openDialog">New invitation</v-btn>
      </template>
    </v-card-item>

    <v-card-text>
      <v-alert
        v-if="registration && registration !== 'invite'"
        class="mb-4"
        type="warning"
        variant="tonal"
      >
        The registrations are <strong>{{ registration }}</strong> on this instance: the invitations only work
        with <code>MSW_REGISTRATION=invite</code> in the environment of the backend.
      </v-alert>

      <v-alert
        v-if="error"
        class="mb-4"
        closable
        type="error"
        @click:close="error = ''"
      >{{ error }}</v-alert>

      <v-alert
        v-if="created"
        class="mb-4"
        closable
        title="Copy the link of the invitation now"
        type="success"
        variant="tonal"
        @click:close="created = null"
      >
        <div v-if="created.email_sent" class="mb-2">Sent by email to {{ created.invitation.email }}.</div>
        <div v-else-if="created.email_error" class="mb-2 text-error">{{ created.email_error }}.</div>
        <div class="mb-2">
          It won't be shown again.
          <template v-if="created.invitation.email">It only registers {{ created.invitation.email }}.</template>
        </div>
        <v-text-field
          density="compact"
          hide-details
          :model-value="created.link"
          readonly
          variant="outlined"
          @focus="($event.target as HTMLInputElement).select()"
        >
          <template #append-inner>
            <v-btn
              :icon="copied ? mdiCheck : mdiContentCopy"
              size="small"
              :title="copied ? 'Copied' : 'Copy'"
              variant="text"
              @click="copy"
            />
          </template>
        </v-text-field>
      </v-alert>

      <div v-if="isLoading">Loading...</div>
      <div v-else-if="invitationsStore.invitations.length === 0" class="text-center text-medium-emphasis pa-4">
        <v-icon class="mb-2" :icon="mdiEmailPlusOutline" size="large" />
        <div>No invitation</div>
      </div>
      <v-table v-else density="compact">
        <thead>
          <tr>
            <th>Code</th>
            <th class="d-none d-sm-table-cell">For</th>
            <th>Status</th>
            <th class="d-none d-md-table-cell">Created</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr v-for="invitation in invitationsStore.invitations" :key="invitation.id">
            <td><code>{{ invitation.hint }}…</code></td>
            <td class="d-none d-sm-table-cell">{{ invitation.email || 'Anyone' }}</td>
            <td class="text-no-wrap">
              <v-chip :color="status(invitation).color" size="x-small" variant="tonal">{{ status(invitation).text }}</v-chip>
            </td>
            <td class="text-no-wrap d-none d-md-table-cell">
              {{ formatDate(invitation.created_at) }} by {{ invitation.created_by }}
            </td>
            <td class="text-right">
              <v-btn
                v-if="!invitation.used_at"
                color="error"
                :icon="mdiDeleteOutline"
                :loading="revoking.has(invitation.id)"
                size="small"
                title="Revoke"
                variant="text"
                @click="revoke(invitation)"
              />
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>

    <v-dialog v-model="dialog" max-width="480">
      <v-card title="New invitation">
        <v-card-text>
          <v-alert
            v-if="createError"
            class="mb-4"
            type="error"
          >{{ createError }}</v-alert>
          <v-text-field
            v-model="form.email"
            autofocus
            hint="Optional: only this email can register with it"
            label="Email"
            persistent-hint
            type="email"
          />
          <v-select
            v-model="form.days"
            class="mt-4"
            :items="durations"
            label="Valid for"
          />
          <v-checkbox
            v-if="userStore.instance?.email"
            v-model="form.send"
            :disabled="!form.email.trim()"
            hide-details
            label="Send it by email"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="dialog = false">Cancel</v-btn>
          <v-btn color="primary" :loading="creating" @click="create">Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>
