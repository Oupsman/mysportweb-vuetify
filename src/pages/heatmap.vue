<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
  import L from 'leaflet'
  import 'leaflet/dist/leaflet.css'
  import { api, errorMessage } from '@/api'
  import { useAppStore } from '@/stores/app'
  import { isoDay } from '@/utils/efforts'
  import { formatDate, formatDistance, sportIcon, sportLabel } from '@/utils/format'
  import { decodePolyline, HeatLayer, type HeatTrace, mainBounds, tracesNear } from '@/utils/heatmap'

  const appStore = useAppStore()

  // the period: its bounds (YYYY-MM-DD, '' for none) as the backend takes them
  const periods = [
    { title: 'All time', value: 'all' },
    { title: 'This year', value: 'year' },
    { title: 'Last year', value: 'lastyear' },
    { title: 'Last 12 months', value: 'last12' },
    { title: 'Custom', value: 'custom' },
  ]
  const period = ref('all')
  const customFrom = ref(isoDay(new Date(new Date().getFullYear(), 0, 1)))
  const customTo = ref(isoDay(new Date()))
  const bounds = (): [string, string] => {
    const now = new Date()
    switch (period.value) {
      case 'year': return [`${now.getFullYear()}-01-01`, '']
      case 'lastyear': return [`${now.getFullYear() - 1}-01-01`, `${now.getFullYear() - 1}-12-31`]
      case 'last12': return [isoDay(new Date(now.getFullYear() - 1, now.getMonth(), now.getDate() + 1)), '']
      case 'custom': return [customFrom.value, customTo.value]
    }
    return ['', '']
  }
  const hideEnds = ref(false)
  const dark = ref(true)

  const traces = shallowRef<HeatTrace[]>([])
  // the sports shown: all of the period by default
  const sports = computed(() => [...new Set(traces.value.map(t => t.sport))].sort())
  const hidden = ref<Set<string>>(new Set())
  const shown = computed(() => traces.value.filter(t => !hidden.value.has(t.sport)))
  const totals = computed(() => ({
    count: shown.value.length,
    distance: shown.value.reduce((sum, t) => sum + t.distance, 0),
  }))
  const toggleSport = (sport: string) => {
    const next = new Set(hidden.value)
    if (next.has(sport)) next.delete(sport)
    else next.add(sport)
    hidden.value = next
  }

  const isLoading = ref(true)
  const error = ref('')
  const mapElement = ref<HTMLElement | null>(null)
  let map: L.Map | null = null
  const layer = new (HeatLayer as any)()
  let fitted = false

  const load = async () => {
    isLoading.value = true
    error.value = ''
    try {
      const [from, to] = bounds()
      const params: Record<string, string> = {}
      if (from) params.from = from
      if (to) params.to = to
      if (hideEnds.value) params.hide_ends = 'true'
      const data = (await api.get('/api/v1/user/heatmap', { params, timeout: 120_000 })).data
      traces.value = (data.activities ?? []).map((a: Omit<HeatTrace, 'lats' | 'lons'> & { trace: string }) => {
        const { lats, lons } = decodePolyline(a.trace)
        return { id: a.id, title: a.title, date: a.date, sport: a.sport, distance: a.distance, bounds: a.bounds, lats, lons }
      })
    } catch (e) {
      error.value = errorMessage(e, 'The heatmap could not be loaded')
    } finally {
      isLoading.value = false
    }
  }

  // the activities passing where the user clicks
  const picked = ref<HeatTrace[]>([])
  const pickedAt = ref<{ x: number, y: number } | null>(null)

  onMounted(async () => {
    if (!mapElement.value) return
    map = L.map(mapElement.value, { preferCanvas: true, zoomControl: true }).setView([46.5, 2.5], 6)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)
    layer.addTo(map)
    map.on('click', (event: L.LeafletMouseEvent) => {
      if (!map) return
      picked.value = tracesNear(map, shown.value, event.latlng)
      pickedAt.value = picked.value.length > 0 ? { x: event.containerPoint.x, y: event.containerPoint.y } : null
    })
    map.on('movestart', () => {
      pickedAt.value = null
    })
    await load()
  })
  onBeforeUnmount(() => {
    map?.remove()
    map = null
  })

  watch(shown, list => {
    layer.setTraces(list)
    // the first load opens where most activities are
    if (!fitted && map && list.length > 0) {
      const b = mainBounds(list)
      if (b) map.fitBounds(b, { padding: [20, 20] })
      fitted = true
    }
  })
  watch([period, customFrom, customTo, hideEnds], load)
</script>

<template>
  <div class="heatmap-page">
    <div class="controls pa-2 d-flex flex-wrap align-center ga-2">
      <v-select
        v-model="period"
        class="period"
        density="compact"
        hide-details
        :items="periods"
        label="Period"
      />
      <template v-if="period === 'custom'">
        <v-text-field
          v-model="customFrom"
          class="day"
          density="compact"
          hide-details
          label="From"
          type="date"
        />
        <v-text-field
          v-model="customTo"
          class="day"
          density="compact"
          hide-details
          label="To"
          type="date"
        />
      </template>
      <v-chip
        v-for="s in sports"
        :key="s"
        :color="hidden.has(s) ? undefined : 'primary'"
        :prepend-icon="sportIcon(s)"
        size="small"
        :variant="hidden.has(s) ? 'outlined' : 'flat'"
        @click="toggleSport(s)"
      >{{ sportLabel(s) }}</v-chip>
      <v-spacer />
      <v-switch
        v-model="hideEnds"
        color="primary"
        density="compact"
        hide-details
        label="Hide starts and ends"
        title="Cuts your privacy distance at both ends of each trace: for screenshots that don't show where you live"
      />
      <v-switch
        v-model="dark"
        color="primary"
        density="compact"
        hide-details
        label="Dark map"
      />
    </div>
    <v-alert v-if="error" class="ma-2" type="error">{{ error }}</v-alert>
    <div class="map-wrap">
      <div ref="mapElement" class="map" :class="{ dark }" />
      <v-progress-linear v-if="isLoading" class="loading" indeterminate />
      <div class="totals text-caption">
        {{ totals.count }} activities · {{ formatDistance(totals.distance) }}
      </div>
      <v-card
        v-if="pickedAt && picked.length"
        class="picked"
        :style="{ left: `${Math.min(pickedAt.x + 12, 9999)}px`, top: `${pickedAt.y + 12}px` }"
        width="300"
      >
        <v-list density="compact">
          <v-list-item
            v-for="t in picked"
            :key="t.id"
            :prepend-icon="sportIcon(t.sport)"
            :subtitle="`${formatDate(t.date)} · ${formatDistance(t.distance)}`"
            :title="t.title"
            @click="appStore.navigateToPage(`/activity/${t.id}`)"
          />
        </v-list>
      </v-card>
    </div>
  </div>
</template>

<style scoped>
.heatmap-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
}
.period {
  max-width: 180px;
}
.day {
  max-width: 170px;
}
.map-wrap {
  position: relative;
  flex: 1;
  min-height: 300px;
}
.map {
  position: absolute;
  inset: 0;
}
/* the tiles darkened: the heat stands out */
.map.dark :deep(.leaflet-tile-pane) {
  filter: grayscale(1) invert(1) brightness(0.75) contrast(1.1);
}
.loading {
  position: absolute;
  top: 0;
  z-index: 500;
}
.totals {
  position: absolute;
  bottom: 24px;
  left: 8px;
  z-index: 500;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
}
.picked {
  position: absolute;
  z-index: 600;
  max-height: 50%;
  overflow-y: auto;
}
</style>
