<script setup lang="ts">
  import { computed, onMounted, ref, shallowRef, watch } from 'vue'
  import { mdiBellOutline, mdiHistory, mdiRefresh } from '@mdi/js'
  import { useAccountStore } from '@/stores/account'
  import type { LogQuery, NotificationLog, UserEvent } from '@/types/adminlogs'

  // what the users do (logins, uploads, deletions, the changes of the admins...) and the notifications they
  // get: when, to whom, about what; never the message
  const accountStore = useAccountStore()
  const pageSize = 100

  // the users of the filters: the list of the Users tab, loaded here when the page opens on this tab
  onMounted(() => {
    if (!accountStore.users.length) {
      accountStore.getUsers().catch(() => {})
    }
  })
  const userItems = computed(() => accountStore.users.map(u => ({ title: u.username, value: u.id })))

  const label = (kind: string) => kind ? kind.replaceAll('_', ' ') : 'unknown'
  const when = (date: string) => new Date(date).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'medium' })
  // how long after being queued it was sent
  const delay = (n: NotificationLog) => {
    if (!n.sent_at) return ''
    const seconds = Math.max(0, Math.round((Date.parse(n.sent_at) - Date.parse(n.created_at)) / 1000))
    return seconds < 60 ? `${seconds} s` : seconds < 3600 ? `${Math.round(seconds / 60)} min` : `${Math.round(seconds / 3600)} h`
  }
  const eventColor = (kind: string) => kind === 'login_failed' || kind === 'login_refused' ? 'error'
    : kind.startsWith('admin_') || kind.endsWith('_deleted') ? 'warning'
      : kind === 'login' ? 'success' : undefined

  // a log loaded by pages of pageSize, newest first, again from the start when its filter changes
  function useLog<T extends { id: number }> (load: (query: LogQuery) => Promise<{ items: T[], kinds: string[], retention?: number }>) {
    const items = shallowRef<T[]>([])
    const kinds = ref<string[]>([])
    const retention = ref<number | undefined>()
    const user = ref<number | null>(null)
    const kind = ref<string | null>(null)
    const loading = ref(false)
    const more = ref(false)
    const error = ref('')
    const fetch = async (append: boolean) => {
      loading.value = true
      error.value = ''
      try {
        const query: LogQuery = { limit: pageSize }
        if (user.value) query.user_id = user.value
        if (kind.value) query.kind = kind.value
        const last = items.value.at(-1)
        if (append && last) query.before = last.id
        const page = await load(query)
        items.value = append ? [...items.value, ...page.items] : page.items
        kinds.value = page.kinds
        retention.value = page.retention
        more.value = page.items.length === pageSize
      } catch (e) {
        error.value = (e as Error).message
      } finally {
        loading.value = false
      }
    }
    watch([user, kind], () => fetch(false))
    onMounted(() => fetch(false))
    return { items, kinds, retention, user, kind, loading, more, error, fetch }
  }

  const events = useLog<UserEvent>(async query => {
    const page = await accountStore.getUserEvents(query)
    return { items: page.events, kinds: page.kinds, retention: page.retention_days }
  })
  const notifications = useLog<NotificationLog>(async query => {
    const page = await accountStore.getNotificationLogs(query)
    return { items: page.notifications, kinds: page.kinds }
  })
  const kindItems = (kinds: string[]) => kinds.map(k => ({ title: label(k), value: k }))
  // the filters show a user's notifications from their events
  const showNotificationsOf = (id: number | null) => {
    if (id) notifications.user.value = id
  }
</script>

<template>
  <div>
    <v-card>
      <v-card-item :prepend-icon="mdiHistory">
        <v-card-title>Activity of the users</v-card-title>
        <v-card-subtitle>
          Logins, uploads, deletions and the changes of the admins, kept {{ events.retention.value ?? 90 }} days
        </v-card-subtitle>
        <template #append>
          <v-btn
            :icon="mdiRefresh"
            :loading="events.loading.value"
            title="Refresh"
            variant="text"
            @click="events.fetch(false)"
          />
        </template>
      </v-card-item>
      <v-card-text>
        <v-row dense>
          <v-col cols="12" sm="6">
            <v-autocomplete
              v-model="events.user.value"
              clearable
              density="compact"
              hide-details
              :items="userItems"
              label="User"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-select
              v-model="events.kind.value"
              clearable
              density="compact"
              hide-details
              :items="kindItems(events.kinds.value)"
              label="Event"
            />
          </v-col>
        </v-row>
        <v-alert v-if="events.error.value" class="mt-4" type="error" variant="tonal">{{ events.error.value }}</v-alert>
        <div v-else-if="!events.items.value.length && !events.loading.value" class="mt-4 text-medium-emphasis">
          Nothing recorded.
        </div>
        <v-table v-else class="mt-2" density="compact">
          <thead>
            <tr>
              <th>When</th>
              <th>User</th>
              <th>Event</th>
              <th class="d-none d-md-table-cell">Detail</th>
              <th class="d-none d-sm-table-cell">IP</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="e in events.items.value" :key="e.id">
              <td class="text-no-wrap">{{ when(e.created_at) }}</td>
              <td>
                <a v-if="e.user_id" href="#" @click.prevent="events.user.value = e.user_id">{{ e.username }}</a>
                <span v-else class="text-medium-emphasis">{{ e.username }} (deleted)</span>
              </td>
              <td>
                <v-chip :color="eventColor(e.kind)" label size="small">{{ label(e.kind) }}</v-chip>
              </td>
              <td class="d-none d-md-table-cell text-medium-emphasis">{{ e.detail }}</td>
              <td class="d-none d-sm-table-cell text-medium-emphasis">{{ e.ip }}</td>
            </tr>
          </tbody>
        </v-table>
        <div v-if="events.more.value" class="text-center mt-2">
          <v-btn :loading="events.loading.value" variant="text" @click="events.fetch(true)">Older</v-btn>
        </div>
      </v-card-text>
    </v-card>

    <v-card class="mt-6">
      <v-card-item :prepend-icon="mdiBellOutline">
        <v-card-title>Notifications</v-card-title>
        <v-card-subtitle>
          When they were queued and sent, to whom and about what; never their message
        </v-card-subtitle>
        <template #append>
          <v-btn
            :icon="mdiRefresh"
            :loading="notifications.loading.value"
            title="Refresh"
            variant="text"
            @click="notifications.fetch(false)"
          />
        </template>
      </v-card-item>
      <v-card-text>
        <v-row dense>
          <v-col cols="12" sm="6">
            <v-autocomplete
              v-model="notifications.user.value"
              clearable
              density="compact"
              hide-details
              :items="userItems"
              label="Recipient"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-select
              v-model="notifications.kind.value"
              clearable
              density="compact"
              hide-details
              :items="kindItems(notifications.kinds.value)"
              label="About"
            />
          </v-col>
        </v-row>
        <v-alert v-if="notifications.error.value" class="mt-4" type="error" variant="tonal">
          {{ notifications.error.value }}
        </v-alert>
        <div
          v-else-if="!notifications.items.value.length && !notifications.loading.value"
          class="mt-4 text-medium-emphasis"
        >
          No notification.
        </div>
        <v-table v-else class="mt-2" density="compact">
          <thead>
            <tr>
              <th>Queued</th>
              <th>Recipient</th>
              <th>About</th>
              <th class="d-none d-sm-table-cell">Channel</th>
              <th>Sent</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="n in notifications.items.value" :key="n.id">
              <td class="text-no-wrap">{{ when(n.created_at) }}</td>
              <td>
                <a href="#" @click.prevent="showNotificationsOf(n.user_id)">{{ n.username }}</a>
              </td>
              <td>{{ label(n.kind) }}</td>
              <td class="d-none d-sm-table-cell">{{ n.provider === 'browser' ? 'push' : n.provider }}</td>
              <td class="text-no-wrap">
                <template v-if="n.sent">
                  <span v-if="n.sent_at">{{ when(n.sent_at) }}</span>
                  <span v-else>yes</span>
                  <span v-if="delay(n)" class="text-medium-emphasis"> ({{ delay(n) }})</span>
                </template>
                <v-chip v-else color="warning" label size="small">pending</v-chip>
              </td>
            </tr>
          </tbody>
        </v-table>
        <div v-if="notifications.more.value" class="text-center mt-2">
          <v-btn :loading="notifications.loading.value" variant="text" @click="notifications.fetch(true)">Older</v-btn>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>
