<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
  import { mdiAlertCircle, mdiAlertOctagon, mdiCheckCircle, mdiHelpCircle, mdiRefresh } from '@mdi/js'
  import StatusChart from '@/components/StatusChart.vue'
  import { useAccountStore } from '@/stores/account'
  import type { CheckLevel, InstanceStatus, StatusPoint } from '@/types/status'
  import { formatBytes } from '@/utils/format'

  // what goes on in the instance, from the metrics of the backend: no Prometheus needed
  const accountStore = useAccountStore()
  const report = ref<InstanceStatus | null>(null)
  const error = ref('')
  const loading = ref(false)

  const load = async () => {
    loading.value = true
    try {
      report.value = await accountStore.getStatus()
      error.value = ''
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }
  // every 30 s while the page is shown
  let timer: ReturnType<typeof setInterval> | undefined
  const tick = () => {
    if (document.visibilityState === 'visible') load()
  }
  onMounted(() => {
    load()
    timer = setInterval(tick, 30_000)
    document.addEventListener('visibilitychange', tick)
  })
  onBeforeUnmount(() => {
    clearInterval(timer)
    document.removeEventListener('visibilitychange', tick)
  })

  const levels: Record<CheckLevel, { color: string, icon: string }> = {
    critical: { color: 'error', icon: mdiAlertOctagon },
    warning: { color: 'warning', icon: mdiAlertCircle },
    unknown: { color: 'grey', icon: mdiHelpCircle },
    ok: { color: 'success', icon: mdiCheckCircle },
  }

  const duration = (seconds: number): string => {
    const s = Math.max(0, Math.round(seconds))
    if (s < 3600) return `${Math.floor(s / 60)} min`
    if (s < 172_800) return `${Math.floor(s / 3600)} h ${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}`
    return `${Math.floor(s / 86_400)} days`
  }
  const uptime = computed(() => report.value
    ? duration((Date.parse(report.value.now) - Date.parse(report.value.started_at)) / 1000)
    : '')
  const ms = (seconds: number | null) => seconds === null ? '–' : `${Math.round(seconds * 1000)} ms`
  const count = (n: number | undefined) => Math.round(n ?? 0).toLocaleString('fr-FR')
  const percent = (part: number, whole: number) => whole > 0 ? Math.min(100, part / whole * 100) : 0

  // the history by 10 minutes: 144 points for the day
  const step = 10
  const buckets = computed(() => {
    const points = report.value?.history ?? []
    const result: { label: string, requests: number, errors: number, p95: number | null, memory: number, cpu: number, analyses: number }[] = []
    for (let i = 0; i < points.length; i += step) {
      const slice: StatusPoint[] = points.slice(i, i + step)
      const last = slice[slice.length - 1]
      const p95s = slice.map(p => p.reads_p95).filter((p): p is number => p !== null)
      result.push({
        label: new Date(last.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        requests: slice.reduce((s, p) => s + p.requests, 0),
        errors: slice.reduce((s, p) => s + p.errors, 0),
        // the slowest minute of the ten
        p95: p95s.length ? Math.max(...p95s) : null,
        memory: last.memory,
        cpu: slice.reduce((s, p) => s + p.cpu, 0) / slice.length,
        analyses: slice.reduce((s, p) => s + p.analyses, 0),
      })
    }
    return result
  })
  const labels = computed(() => buckets.value.map(b => b.label))
  const backfills = computed(() => (report.value?.backfills ?? []).filter(b => b.running || b.errors > 0 || b.remaining > 0))
</script>

<template>
  <v-card>
    <v-card-item>
      <v-card-title>Status</v-card-title>
      <v-card-subtitle>
        What goes on in the instance<span v-if="report">, at {{ new Date(report.now).toLocaleTimeString('fr-FR') }}</span>
      </v-card-subtitle>
      <template #append>
        <v-btn
          :icon="mdiRefresh"
          :loading="loading"
          size="small"
          title="Refresh"
          variant="text"
          @click="load"
        />
      </template>
    </v-card-item>
    <v-card-text>
      <v-alert v-if="error" class="mb-4" type="error" variant="tonal">{{ error }}</v-alert>
      <v-progress-linear v-if="!report && !error" indeterminate />
      <template v-if="report">
        <!-- the checks, the worst first -->
        <v-list class="mb-2" density="compact">
          <v-list-item v-for="check in report.checks" :key="check.name" class="px-0">
            <template #prepend>
              <v-icon :color="levels[check.level].color" :icon="levels[check.level].icon" />
            </template>
            <v-list-item-title><strong>{{ check.name }}</strong></v-list-item-title>
            <v-list-item-subtitle class="status-message">{{ check.message }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>

        <v-row dense>
          <v-col cols="6" md="3">
            <div class="text-caption text-medium-emphasis">Version</div>
            <div>{{ report.version }} · schema {{ report.schema }}</div>
            <div class="text-caption">up {{ uptime }}</div>
          </v-col>
          <v-col cols="6" md="3">
            <div class="text-caption text-medium-emphasis">Users · activities</div>
            <div>{{ count(report.users) }} · {{ count(report.activities) }}</div>
          </v-col>
          <v-col cols="6" md="3">
            <div class="text-caption text-medium-emphasis">Memory</div>
            <div>
              {{ formatBytes(report.memory.resident) }}<span v-if="report.memory.limit"> / {{ formatBytes(report.memory.limit) }}</span>
            </div>
            <v-progress-linear
              v-if="report.memory.limit"
              :color="percent(report.memory.resident, report.memory.limit) > 85 ? 'warning' : 'primary'"
              height="4"
              :model-value="percent(report.memory.resident, report.memory.limit)"
              rounded
            />
          </v-col>
          <v-col cols="6" md="3">
            <div class="text-caption text-medium-emphasis">CPU · goroutines</div>
            <div>{{ report.cpu.toFixed(2) }} cores · {{ count(report.goroutines) }}</div>
          </v-col>
          <v-col cols="6" md="3">
            <div class="text-caption text-medium-emphasis">Database connections</div>
            <div>{{ report.database.in_use }} in use · {{ report.database.open }} open / {{ report.database.max }}</div>
          </v-col>
          <v-col cols="6" md="3">
            <div class="text-caption text-medium-emphasis">Analyses · thumbnails running</div>
            <div>
              {{ report.slots.analysis?.in_use ?? 0 }}/{{ report.slots.analysis?.capacity ?? 0 }} ·
              {{ report.slots.thumbnail?.in_use ?? 0 }}/{{ report.slots.thumbnail?.capacity ?? 0 }}
            </div>
          </v-col>
          <v-col v-if="report.disk" cols="6" md="3">
            <div class="text-caption text-medium-emphasis">Disk of the media</div>
            <div>{{ formatBytes(report.disk.free) }} free / {{ formatBytes(report.disk.total) }}</div>
            <v-progress-linear
              :color="percent(report.disk.free, report.disk.total) < 10 ? 'warning' : 'primary'"
              height="4"
              :model-value="100 - percent(report.disk.free, report.disk.total)"
              rounded
            />
          </v-col>
          <v-col cols="6" md="3">
            <div class="text-caption text-medium-emphasis">Last hour</div>
            <div>{{ count(report.last_hour.requests) }} requests · {{ count(report.last_hour.errors) }} errors</div>
            <div class="text-caption">
              reads p95 {{ ms(report.last_hour.reads_p95) }} ·
              {{ count(report.last_hour.analyses.ok) }} uploads · {{ count(report.last_hour.logins.success) }} logins
            </div>
          </v-col>
        </v-row>

        <template v-if="buckets.length > 1">
          <div class="text-subtitle-2 mt-4 mb-2">
            Since {{ new Date(report.last_day.since).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) }}, by 10 minutes
          </div>
          <v-row dense>
            <v-col cols="12" md="6">
              <StatusChart
                :format="v => String(Math.round(v))"
                :labels="labels"
                :series="[
                  { label: 'Requests', color: 'rgb(25, 118, 210)', values: buckets.map(b => b.requests), fill: true },
                  { label: 'Server errors', color: 'rgb(211, 47, 47)', values: buckets.map(b => b.errors) },
                ]"
                title="Requests, server errors"
              />
            </v-col>
            <v-col cols="12" md="6">
              <StatusChart
                :format="v => `${Math.round(v * 1000)} ms`"
                :labels="labels"
                :series="[{ label: 'Reads p95', color: 'rgb(123, 31, 162)', values: buckets.map(b => b.p95) }]"
                title="Response time of the reads (p95)"
              />
            </v-col>
            <v-col cols="12" md="6">
              <StatusChart
                :format="v => formatBytes(v)"
                :labels="labels"
                :series="[{ label: 'Memory', color: 'rgb(0, 137, 123)', values: buckets.map(b => b.memory), fill: true }]"
                title="Memory"
              />
            </v-col>
            <v-col cols="12" md="6">
              <StatusChart
                :format="v => String(Math.round(v))"
                :labels="labels"
                :series="[{ label: 'Uploads analysed', color: 'rgb(245, 124, 0)', values: buckets.map(b => b.analyses), fill: true }]"
                title="Uploads analysed"
              />
            </v-col>
          </v-row>
        </template>
        <div v-else class="text-caption text-medium-emphasis mt-4">
          The charts of the last day show after 20 minutes: the backend keeps a sample a minute, since its start.
        </div>

        <template v-if="backfills.length">
          <div class="text-subtitle-2 mt-4 mb-1">Backfills</div>
          <v-table density="compact">
            <tbody>
              <tr v-for="b in backfills" :key="b.step">
                <td>{{ b.step }}</td>
                <td>{{ b.running ? 'running' : 'done' }}</td>
                <td class="text-right">{{ b.remaining > 0 ? `${count(b.remaining)} left` : '' }}</td>
                <td :class="b.errors > 0 ? 'text-error' : ''">{{ b.errors > 0 ? 'failed' : '' }}</td>
              </tr>
            </tbody>
          </v-table>
        </template>
      </template>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.status-message {
  white-space: normal;
  -webkit-line-clamp: unset;
  line-clamp: unset;
}
</style>
