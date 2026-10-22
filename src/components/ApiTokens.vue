<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { mdiCheck, mdiContentCopy, mdiDeleteOutline, mdiKeyVariant, mdiPlus } from '@mdi/js'
  import { useTokensStore } from '@/stores/tokens'
  import type { DeviceToken, TokenAction, TokenPermission, TokenResource } from '@/types/tokens'
  import { formatDate } from '@/utils/format'

  const tokensStore = useTokensStore()

  const isLoading = ref(true)
  const error = ref('')
  const revoking = ref(new Set<string>())

  const load = async () => {
    isLoading.value = true
    error.value = ''
    try {
      await tokensStore.getTokens()
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      isLoading.value = false
    }
  }
  onMounted(load)

  const resources: { value: TokenResource, title: string }[] = [
    { value: 'activities', title: 'Activities' },
    { value: 'equipments', title: 'Equipments' },
    { value: 'healthdatas', title: 'Health datas' },
  ]
  const actions: TokenAction[] = ['read', 'create', 'write', 'delete']
  const allPermissions = resources.flatMap(r => actions.map(a => `${r.value}:${a}` as TokenPermission))

  // the backend refuses tokens living more than a year
  const durations = [
    { title: '30 days', value: 30 },
    { title: '90 days', value: 90 },
    { title: '1 year', value: 365 },
  ]

  const isExpired = (token: DeviceToken) => new Date(token.expires_at) <= new Date()

  // "activities: read, create · equipments: read"
  const describePermissions = (permissions: TokenPermission[]): string =>
    resources
      .map(r => {
        const granted = actions.filter(a => permissions.includes(`${r.value}:${a}`))
        return granted.length > 0 ? `${r.title}: ${granted.join(', ')}` : ''
      })
      .filter(Boolean)
      .join(' · ')

  // creation dialog
  const dialog = ref(false)
  const creating = ref(false)
  const createError = ref('')
  const form = ref({ name: '', permissions: [] as TokenPermission[], days: 90 })

  const openDialog = () => {
    form.value = { name: '', permissions: [], days: 90 }
    createError.value = ''
    dialog.value = true
  }

  const toggleResource = (resource: TokenResource, on: boolean) => {
    const others = form.value.permissions.filter(p => !p.startsWith(`${resource}:`))
    form.value.permissions = on ? [...others, ...actions.map(a => `${resource}:${a}` as TokenPermission)] : others
  }
  const resourceState = (resource: TokenResource) => {
    const n = actions.filter(a => form.value.permissions.includes(`${resource}:${a}`)).length
    return { all: n === actions.length, some: n > 0 && n < actions.length }
  }

  const canCreate = computed(() =>
    form.value.name.trim() !== '' && form.value.name.length <= 100 && form.value.permissions.length > 0)

  // the value of the created token, shown once
  const createdToken = ref('')
  const copied = ref(false)

  const create = async () => {
    creating.value = true
    createError.value = ''
    try {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + form.value.days)
      createdToken.value = await tokensStore.createToken({
        name: form.value.name.trim(),
        // in the order of the table, the backend returns them this way
        permissions: allPermissions.filter(p => form.value.permissions.includes(p)),
        expires_at: expiresAt.toISOString(),
      })
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
      await navigator.clipboard.writeText(createdToken.value)
      copied.value = true
    } catch {
      // no clipboard outside https: the field stays selectable
      copied.value = false
    }
  }

  const revoke = async (token: DeviceToken) => {
    if (!confirm(`Revoke the token "${token.name}"? The devices using it will lose access immediately.`)) {
      return
    }
    error.value = ''
    revoking.value.add(token.id)
    try {
      await tokensStore.revokeToken(token.id)
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      revoking.value.delete(token.id)
    }
  }
</script>

<template>
  <v-card>
    <v-card-item>
      <v-card-title>API tokens</v-card-title>
      <v-card-subtitle>
        For devices and scripts using the API. A token only grants the permissions chosen at its creation.
      </v-card-subtitle>
      <template #append>
        <v-btn color="primary" :prepend-icon="mdiPlus" @click="openDialog">New token</v-btn>
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
        v-if="createdToken"
        class="mb-4"
        closable
        title="Copy your new token now"
        type="success"
        variant="tonal"
        @click:close="createdToken = ''"
      >
        <div class="mb-2">It won't be shown again. Send it in the header <code>Authorization: Bearer &lt;token&gt;</code>.</div>
        <v-text-field
          density="compact"
          hide-details
          :model-value="createdToken"
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
      <div v-else-if="tokensStore.tokens.length === 0" class="text-center text-medium-emphasis pa-4">
        <v-icon class="mb-2" :icon="mdiKeyVariant" size="large" />
        <div>No API token</div>
      </div>
      <v-table v-else density="compact">
        <thead>
          <tr>
            <th>Name</th>
            <th class="d-none d-md-table-cell">Permissions</th>
            <th>Expires</th>
            <!-- phones: name, expiry and revoke -->
            <th class="d-none d-sm-table-cell">Last used</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr v-for="token in tokensStore.tokens" :key="token.id">
            <td>
              <div>{{ token.name }}</div>
              <code class="text-caption text-medium-emphasis">{{ token.hint }}…</code>
            </td>
            <td class="text-caption d-none d-md-table-cell">{{ describePermissions(token.permissions) }}</td>
            <td class="text-no-wrap">
              <v-chip v-if="isExpired(token)" color="error" size="x-small" variant="tonal">Expired</v-chip>
              <template v-else>{{ formatDate(token.expires_at) }}</template>
            </td>
            <td class="text-no-wrap d-none d-sm-table-cell">
              {{ token.last_used_at ? formatDate(token.last_used_at) : 'Never' }}
            </td>
            <td class="text-right">
              <v-btn
                color="error"
                :icon="mdiDeleteOutline"
                :loading="revoking.has(token.id)"
                size="small"
                title="Revoke"
                variant="text"
                @click="revoke(token)"
              />
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>

    <v-dialog v-model="dialog" max-width="560">
      <v-card title="New API token">
        <v-card-text>
          <v-alert
            v-if="createError"
            class="mb-4"
            type="error"
          >{{ createError }}</v-alert>
          <v-text-field
            v-model="form.name"
            autofocus
            counter="100"
            hint="The device or script using it, e.g. Garmin sync"
            label="Name"
            persistent-hint
          />
          <v-select
            v-model="form.days"
            class="mt-4"
            :items="durations"
            label="Expires in"
          />
          <div class="text-subtitle-2 mb-1">Permissions</div>
          <v-table density="compact">
            <thead>
              <tr>
                <th />
                <th v-for="action in actions" :key="action" class="text-center text-capitalize">{{ action }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="resource in resources" :key="resource.value">
                <td>
                  <v-checkbox-btn
                    :indeterminate="resourceState(resource.value).some"
                    :label="resource.title"
                    :model-value="resourceState(resource.value).all"
                    @update:model-value="toggleResource(resource.value, !!$event)"
                  />
                </td>
                <td v-for="action in actions" :key="action">
                  <v-checkbox-btn
                    v-model="form.permissions"
                    class="justify-center"
                    :value="`${resource.value}:${action}`"
                  />
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="dialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            :disabled="!canCreate"
            :loading="creating"
            @click="create"
          >Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>
