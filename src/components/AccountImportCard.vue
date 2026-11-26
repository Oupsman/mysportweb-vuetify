<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
  import { mdiCloseCircleOutline, mdiUpload } from '@mdi/js'
  import { useAccountStore } from '@/stores/account'
  import type { AccountImport } from '@/types/user'
  import { formatBytes } from '@/utils/format'

  const accountStore = useAccountStore()

  // the latest import of the user, read again every few seconds while it runs
  const latest = ref<AccountImport | null>(null)
  const loadError = ref('')
  const file = ref<File | File[] | null>(null)
  const withProfile = ref(false)
  // the share of the zip sent, null when no upload runs
  const uploaded = ref<number | null>(null)
  const uploadError = ref('')
  const cancelling = ref(false)

  const running = computed(() => latest.value?.status === 'pending' || latest.value?.status === 'running')
  const chosen = computed((): File | null => Array.isArray(file.value) ? file.value[0] ?? null : file.value)

  let timer: ReturnType<typeof setTimeout> | undefined
  const refresh = async () => {
    clearTimeout(timer)
    try {
      latest.value = await accountStore.getImport()
      loadError.value = ''
    } catch (e) {
      loadError.value = (e as Error).message
    }
    if (running.value) timer = setTimeout(refresh, 3000)
  }
  onMounted(refresh)
  onBeforeUnmount(() => clearTimeout(timer))

  const start = async () => {
    const zip = chosen.value
    if (!zip) return
    uploadError.value = ''
    uploaded.value = 0
    try {
      latest.value = await accountStore.startImport(zip, withProfile.value, share => (uploaded.value = share))
      file.value = null
      await refresh()
    } catch (e) {
      uploadError.value = (e as Error).message
    } finally {
      uploaded.value = null
    }
  }

  const cancel = async () => {
    cancelling.value = true
    try {
      await accountStore.cancelImport()
    } catch (e) {
      loadError.value = (e as Error).message
    } finally {
      cancelling.value = false
      await refresh()
    }
  }

  // the kinds of items of the report, in the order of the import, with their label
  const kinds: [string, string][] = [
    ['activities', 'Activities'],
    ['equipments', 'Equipment'],
    ['pictures', 'Equipment pictures'],
    ['reminders', 'Maintenance reminders'],
    ['services', 'Services'],
    ['devices', 'Devices'],
    ['health', 'Health measures'],
    ['commute routes', 'Commute routes'],
    ['segments', 'Segments'],
    ['goals', 'Goals'],
    ['profile', 'Profile settings'],
  ]
  const rows = computed(() => {
    const counts = latest.value?.report?.counts ?? {}
    return kinds.filter(([kind]) => counts[kind]).map(([kind, label]) => ({ label, ...counts[kind] }))
  })
  const problems = computed(() => latest.value?.report?.problems ?? [])
  const finished = computed(() => {
    const at = latest.value?.finished_at
    return at ? new Date(at).toLocaleString() : ''
  })
  const outcome = computed(() => {
    switch (latest.value?.status) {
      case 'done': return { type: 'success' as const, text: `Import finished on ${finished.value}.` }
      case 'cancelled': return { type: 'warning' as const, text: `Import cancelled on ${finished.value}: what it imported before stays.` }
      case 'failed': return { type: 'error' as const, text: `Import failed on ${finished.value}: ${latest.value?.error}. What it imported before stays; importing the zip again goes on from there.` }
      default: return null
    }
  })
</script>

<template>
  <v-card>
    <v-card-item :prepend-icon="mdiUpload">
      <v-card-title>Import an export</v-card-title>
      <v-card-subtitle>From this instance or another one</v-card-subtitle>
    </v-card-item>
    <v-card-text>
      <p class="mb-3">
        Choose the zip of an export: what your account doesn't have is added. Your activities are analysed again
        from their files, with the titles, equipment, visibility and trims you had set; your equipment, devices,
        health measures, segments and goals come along. Nothing of your account is replaced: importing the same
        zip twice adds nothing. It runs in the background, you can leave this page.
      </p>
      <v-alert v-if="loadError" class="mb-3" type="error" variant="tonal">{{ loadError }}</v-alert>

      <template v-if="running && latest">
        <div class="mb-2">
          <template v-if="latest.status === 'pending'">Waiting to start…</template>
          <template v-else>Importing the activities: {{ latest.done }} of {{ latest.total }}</template>
        </div>
        <v-progress-linear
          class="mb-3"
          color="primary"
          height="8"
          :indeterminate="latest.status === 'pending' || latest.total === 0"
          :model-value="latest.total ? (latest.done / latest.total) * 100 : 0"
          rounded
        />
        <v-btn :loading="cancelling" :prepend-icon="mdiCloseCircleOutline" variant="text" @click="cancel">
          Stop the import
        </v-btn>
      </template>

      <template v-else>
        <v-file-input
          v-model="file"
          accept=".zip,application/zip"
          :disabled="uploaded !== null"
          :hint="chosen ? formatBytes(chosen.size) : ''"
          label="The zip of an export"
          persistent-hint
          prepend-icon=""
          :prepend-inner-icon="mdiUpload"
        />
        <v-checkbox
          v-model="withProfile"
          class="mt-1"
          :disabled="uploaded !== null"
          hide-details
          label="Also take the settings of my profile from it: weight, height, heart rate, FTP, units, timezone, home town, privacy distance, dashboard"
        />
        <v-progress-linear
          v-if="uploaded !== null"
          class="my-3"
          color="primary"
          height="8"
          :model-value="uploaded * 100"
          rounded
        />
        <div v-if="uploaded !== null" class="text-caption mb-2">
          Sending the zip: {{ Math.round(uploaded * 100) }} %. Keep this page open until it is sent.
        </div>
        <v-alert v-if="uploadError" class="my-3" type="error" variant="tonal">{{ uploadError }}</v-alert>
        <v-btn
          class="mt-3"
          color="primary"
          :disabled="!chosen"
          :loading="uploaded !== null"
          variant="outlined"
          @click="start"
        >
          Import
        </v-btn>
      </template>

      <template v-if="latest && !running">
        <v-divider class="my-4" />
        <v-alert v-if="outcome" class="mb-3" :type="outcome.type" variant="tonal">{{ outcome.text }}</v-alert>
        <v-table v-if="rows.length" density="compact">
          <thead>
            <tr>
              <th />
              <th class="text-right">Added</th>
              <th class="text-right">Already there</th>
              <th class="text-right">Skipped</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.label">
              <td>{{ row.label }}</td>
              <td class="text-right">{{ row.created }}</td>
              <td class="text-right">{{ row.existing }}</td>
              <td class="text-right">{{ row.skipped }}</td>
            </tr>
          </tbody>
        </v-table>
        <v-expansion-panels v-if="problems.length" class="mt-3">
          <v-expansion-panel :title="`What was skipped or not restored (${problems.length + (latest.report?.more_problems ?? 0)})`">
            <v-expansion-panel-text>
              <ul class="pl-4">
                <li v-for="(problem, index) in problems" :key="index">
                  <code>{{ problem.item }}</code>: {{ problem.error }}
                </li>
                <li v-if="latest.report?.more_problems">… and {{ latest.report.more_problems }} more</li>
              </ul>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </template>
    </v-card-text>
  </v-card>
</template>
