<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import type { LocationQuery } from 'vue-router'
  import { useRoute, useRouter } from 'vue-router'
  import { mdiDeleteOutline, mdiFilterRemoveOutline, mdiMagnify, mdiPencil } from '@mdi/js'
  import { useActivitiesStore } from '@/stores/activities'
  import { useAppStore } from '@/stores/app'
  import { useEquipmentsStore } from '@/stores/equipments'
  import type { ActivityRow, ActivitySearch } from '@/types/activities'
  import {
    formatDate,
    formatDistance,
    formatDuration,
    formatElevation,
    formatSpeed,
    sportColor,
    sportIcon,
    sportLabel,
  } from '@/utils/format'

  // the filters, sort and page live in the URL: a reload, a bookmark or the back button keep them
  const route = useRoute()
  const router = useRouter()
  const activitiesStore = useActivitiesStore()
  const appStore = useAppStore()
  const equipmentsStore = useEquipmentsStore()

  const defaults = { sort: 'date', order: 'desc', page: '1', per_page: '25' }
  const first = (v: LocationQuery[string]): string => (Array.isArray(v) ? v[0] : v) ?? ''
  const all = (v: LocationQuery[string]): string[] => (Array.isArray(v) ? v : v ? [v] : []).filter((s): s is string => !!s)

  const query = computed(() => ({
    q: first(route.query.q),
    sport: all(route.query.sport),
    from: first(route.query.from),
    to: first(route.query.to),
    equipment: first(route.query.equipment),
    device: first(route.query.device), // a device name, 'none' or '' for all
    commute: first(route.query.commute), // 'true', 'false' or '' for all the activities
    sort: first(route.query.sort) || defaults.sort,
    order: first(route.query.order) || defaults.order,
    page: Number(first(route.query.page) || defaults.page),
    perPage: Number(first(route.query.per_page) || defaults.per_page),
  }))

  // changes the URL, leaving out the default values; a new filter goes back to the first page
  const update = (changes: Record<string, string | string[] | null>, resetPage = true) => {
    const next: Record<string, string | string[]> = {}
    for (const [key, value] of Object.entries({ ...route.query, ...(resetPage ? { page: null } : {}), ...changes })) {
      const isDefault = defaults[key as keyof typeof defaults] === value
      if (value !== null && value !== '' && !(Array.isArray(value) && value.length === 0) && !isDefault) {
        next[key] = value as string | string[]
      }
    }
    router.replace({ query: next })
  }

  // title search: applied once the user stops typing
  const search = ref(query.value.q)
  let typing: ReturnType<typeof setTimeout> | undefined
  watch(search, value => {
    clearTimeout(typing)
    typing = setTimeout(() => update({ q: value.trim() || null }), 300)
  })

  // periods: all time, last 12 months, a year, or custom dates
  const pad = (n: number) => String(n).padStart(2, '0')
  const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const lastYear = () => {
    const from = new Date()
    from.setFullYear(from.getFullYear() - 1)
    from.setDate(from.getDate() + 1)
    return { from: isoDate(from), to: isoDate(new Date()) }
  }
  const result = ref<ActivitySearch | null>(null)
  const periods = computed(() => [
    { title: 'All time', value: 'all' },
    { title: 'Last 12 months', value: '12m' },
    ...(result.value?.years ?? []).map(y => ({ title: String(y), value: `year:${y}` })),
    { title: 'Custom dates', value: 'custom' },
  ])
  const customDates = ref(false)
  const period = computed(() => {
    const { from, to } = query.value
    if (!from && !to) {
      return customDates.value ? 'custom' : 'all'
    }
    const last = lastYear()
    if (from === last.from && to === last.to) {
      return '12m'
    }
    const year = from.slice(0, 4)
    if (from === `${year}-01-01` && to === `${year}-12-31`) {
      return `year:${year}`
    }
    return 'custom'
  })
  const choosePeriod = (value: string) => {
    customDates.value = value === 'custom'
    if (value === 'all') {
      update({ from: null, to: null })
    } else if (value === '12m') {
      update(lastYear())
    } else if (value.startsWith('year:')) {
      const year = value.slice(5)
      update({ from: `${year}-01-01`, to: `${year}-12-31` })
    }
  }

  const equipments = computed(() => [
    { title: 'No equipment', value: 'none' },
    ...equipmentsStore.equipments.map(e => ({ title: e.name, value: e.id ?? '' })),
  ])

  // the number of activities on a second line of the menu: the field only shows the name
  const devices = computed(() => [
    { title: 'No device', value: 'none', subtitle: 'Entered by hand, or not told by the file' },
    ...(result.value?.devices ?? []).map(d => ({
      title: d.name,
      value: d.name,
      subtitle: `${d.activities} ${d.activities > 1 ? 'activities' : 'activity'}`,
    })),
  ])

  const commuteFilters = [
    { title: 'Commutes only', value: 'true' },
    { title: 'Without commutes', value: 'false' },
  ]

  const hasFilters = computed(() => {
    const q = query.value
    return !!(q.q || q.sport.length || q.from || q.to || q.equipment || q.device || q.commute)
  })
  const resetFilters = () => {
    search.value = ''
    customDates.value = false
    update({ q: null, sport: null, from: null, to: null, equipment: null, device: null, commute: null })
  }

  // the search, again on every change of the URL
  const isLoading = ref(false)
  const error = ref('')
  let latest = 0
  const load = async () => {
    const q = query.value
    const params: Record<string, string | string[]> = {
      sort: q.sort, order: q.order, page: String(q.page), per_page: String(q.perPage),
    }
    if (q.q) params.q = q.q
    if (q.sport.length) params.sport = q.sport
    if (q.from) params.from = q.from
    if (q.to) params.to = q.to
    if (q.equipment) params.equipment = q.equipment
    if (q.device) params.device = q.device
    if (q.commute) params.commute = q.commute
    const request = ++latest
    isLoading.value = true
    error.value = ''
    try {
      const response = await activitiesStore.searchActivities(params)
      // only the answer to the latest search: an older one may arrive after it
      if (request === latest) {
        result.value = response
      }
    } catch {
      if (request === latest) {
        error.value = 'The activities could not be loaded'
      }
    } finally {
      if (request === latest) {
        isLoading.value = false
      }
    }
  }
  watch(() => route.query, () => {
    // the URL may be changed elsewhere (back button): the search field follows it
    if (search.value.trim() !== query.value.q) {
      search.value = query.value.q
    }
    load()
  }, { immediate: true, deep: true })

  const headers = [
    { title: '', key: 'sport', sortable: false, width: 40 },
    { title: 'Date', key: 'date' },
    { title: 'Title', key: 'title' },
    { title: 'Distance', key: 'distance', align: 'end' },
    { title: 'Time', key: 'duration', align: 'end' },
    { title: 'Speed', key: 'speed', align: 'end' },
    { title: 'Elevation', key: 'elevation', align: 'end' },
    { title: 'Equipment', key: 'equipment', sortable: false },
    { title: '', key: 'actions', sortable: false, align: 'end' },
  ] as const
  const sortBy = computed(() => [{ key: query.value.sort, order: query.value.order as 'asc' | 'desc' }])
  const onOptions = (options: { page: number, itemsPerPage: number, sortBy: { key: string, order?: boolean | 'asc' | 'desc' }[] }) => {
    const sort = options.sortBy[0]
    const changes = {
      page: String(options.page),
      per_page: String(options.itemsPerPage),
      sort: sort?.key ?? defaults.sort,
      order: sort?.order === 'asc' ? 'asc' : 'desc',
    }
    const q = query.value
    if (changes.page !== String(q.page) || changes.per_page !== String(q.perPage) || changes.sort !== q.sort || changes.order !== q.order) {
      // a new sort or page size starts again at the first page
      const samePaging = changes.per_page === String(q.perPage) && changes.sort === q.sort && changes.order === q.order
      update(samePaging ? changes : { ...changes, page: null }, false)
    }
  }

  const open = (id: string) => appStore.navigateToPage(`/activity/${id}`)
  const onRowClick = (_: Event, row: { item: ActivityRow }) => open(row.item.id)
  const remove = async (activity: ActivityRow) => {
    try {
      if (await activitiesStore.deleteActivity(activity.id)) {
        load()
      }
    } catch {
      error.value = 'The activity could not be deleted'
    }
  }
</script>

<template>
  <div>
    <!-- filters -->
    <v-row class="mb-1" dense>
      <v-col cols="12" md="3" sm="6">
        <v-text-field
          v-model="search"
          clearable
          density="compact"
          hide-details
          label="Search a title"
          :prepend-inner-icon="mdiMagnify"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="2" sm="6">
        <v-select
          density="compact"
          hide-details
          :items="periods"
          label="Period"
          :model-value="period"
          variant="outlined"
          @update:model-value="choosePeriod"
        />
      </v-col>
      <template v-if="period === 'custom'">
        <v-col cols="6" md="2">
          <v-text-field
            density="compact"
            hide-details
            label="From"
            :model-value="query.from"
            type="date"
            variant="outlined"
            @update:model-value="v => update({ from: v || null })"
          />
        </v-col>
        <v-col cols="6" md="2">
          <v-text-field
            density="compact"
            hide-details
            label="To"
            :model-value="query.to"
            type="date"
            variant="outlined"
            @update:model-value="v => update({ to: v || null })"
          />
        </v-col>
      </template>
      <v-col cols="12" md="2" sm="6">
        <v-select
          clearable
          density="compact"
          hide-details
          :items="equipments"
          label="Equipment"
          :model-value="query.equipment || null"
          variant="outlined"
          @update:model-value="v => update({ equipment: v })"
        />
      </v-col>
      <!-- wider: device names are long (Hammerhead Karoo 2) -->
      <v-col cols="12" md="3" sm="6">
        <v-select
          clearable
          density="compact"
          hide-details
          :item-props="true"
          :items="devices"
          label="Device"
          :model-value="query.device || null"
          variant="outlined"
          @update:model-value="v => update({ device: v })"
        />
      </v-col>
      <v-col cols="12" md="2" sm="6">
        <v-select
          clearable
          density="compact"
          hide-details
          :items="commuteFilters"
          label="Commutes"
          :model-value="query.commute || null"
          variant="outlined"
          @update:model-value="v => update({ commute: v })"
        />
      </v-col>
    </v-row>
    <div class="d-flex flex-wrap align-center ga-2 mb-3">
      <v-chip-group
        column
        filter
        :model-value="query.sport"
        multiple
        @update:model-value="v => update({ sport: v as string[] })"
      >
        <v-chip
          v-for="sport in result?.sports ?? []"
          :key="sport"
          :color="sportColor(sport)"
          :prepend-icon="sportIcon(sport)"
          size="small"
          :value="sport"
          variant="outlined"
        >
          {{ sportLabel(sport) }}
        </v-chip>
      </v-chip-group>
      <v-spacer />
      <v-btn
        v-if="hasFilters"
        :prepend-icon="mdiFilterRemoveOutline"
        size="small"
        variant="text"
        @click="resetFilters"
      >
        Reset filters
      </v-btn>
    </div>

    <!-- totals of all the matching activities -->
    <div v-if="result" class="text-body-1 mb-2">
      <strong>{{ result.total }}</strong> {{ result.total === 1 ? 'activity' : 'activities' }}
      <template v-if="result.total > 0">
        · {{ formatDistance(result.totals.distance) }} · {{ formatDuration(result.totals.duration) }}
        · {{ formatElevation(result.totals.elevation) }}
      </template>
    </div>
    <v-alert
      v-if="error"
      class="mb-2"
      density="compact"
      type="error"
      variant="tonal"
    >{{ error }}</v-alert>

    <v-card>
      <v-data-table-server
        class="activities-table"
        density="compact"
        :headers="headers"
        hover
        :items="result?.activities ?? []"
        :items-length="result?.total ?? 0"
        :items-per-page="query.perPage"
        :items-per-page-options="[25, 50, 100]"
        :loading="isLoading"
        must-sort
        no-data-text="No activity matches these filters"
        :page="query.page"
        :sort-by="sortBy"
        @click:row="onRowClick"
        @update:options="onOptions"
      >
        <template #[`item.sport`]="{ item }">
          <v-icon :color="sportColor(item.sport)" :icon="sportIcon(item.sport)" size="small" :title="sportLabel(item.sport)" />
        </template>
        <template #[`item.date`]="{ item }"><span class="text-no-wrap">{{ formatDate(item.date) }}</span></template>
        <template #[`item.distance`]="{ item }"><span class="text-no-wrap">{{ formatDistance(item.distance) }}</span></template>
        <template #[`item.duration`]="{ item }"><span class="text-no-wrap">{{ formatDuration(item.duration) }}</span></template>
        <template #[`item.speed`]="{ item }"><span class="text-no-wrap">{{ formatSpeed(item.avg_speed) }}</span></template>
        <template #[`item.elevation`]="{ item }"><span class="text-no-wrap">{{ formatElevation(item.elevation) }}</span></template>
        <template #[`item.equipment`]="{ item }">
          <span class="text-medium-emphasis">{{ item.equipment_name ?? '' }}</span>
        </template>
        <template #[`item.actions`]="{ item }">
          <span class="text-no-wrap">
            <v-btn
              density="comfortable"
              :icon="mdiPencil"
              size="small"
              title="Edit"
              variant="text"
              @click.stop="appStore.navigateToPage(`/activity/${item.id}/edit`)"
            />
            <v-btn
              density="comfortable"
              :icon="mdiDeleteOutline"
              size="small"
              title="Delete"
              variant="text"
              @click.stop="remove(item)"
            />
          </span>
        </template>
      </v-data-table-server>
    </v-card>
  </div>
</template>

<style scoped>
.activities-table :deep(tbody tr) {
  cursor: pointer;
}
</style>
