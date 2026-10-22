<script setup lang="ts">
  import { computed, ref } from 'vue'
  import type { PropType } from 'vue'
  import { mdiChevronLeft, mdiChevronRight } from '@mdi/js'
  import { useUserStore } from '@/stores/user'
  import type { CalendarActivity } from '@/types/dashboard'
  import { formatDistance, sportColor, sportLabel } from '@/utils/format'

  // compact month grid, weeks starting on Monday like the dashboard totals:
  // a dot per activity, in the color of its sport
  const props = defineProps({
    // the activities of the current month, from the dashboard
    activities: {
      type: Array as PropType<CalendarActivity[]>,
      required: true,
    },
  })
  const emit = defineEmits<{ open: [id: string] }>()
  const userStore = useUserStore()

  const today = new Date()
  // first day of the shown month
  const shown = ref(new Date(today.getFullYear(), today.getMonth(), 1))
  const isCurrent = computed(() =>
    shown.value.getFullYear() === today.getFullYear() && shown.value.getMonth() === today.getMonth())
  const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  const title = computed(() => new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(shown.value))
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  // other months are fetched once, the current one comes from the dashboard
  const loaded = ref(new Map<string, CalendarActivity[]>())
  const isLoading = ref(false)
  const error = ref('')
  const shownActivities = computed(() =>
    isCurrent.value ? props.activities : loaded.value.get(monthKey(shown.value)) ?? [])

  const show = async (month: Date) => {
    shown.value = month
    error.value = ''
    const key = monthKey(month)
    if (isCurrent.value || loaded.value.has(key)) {
      return
    }
    isLoading.value = true
    try {
      const activities = await userStore.getCalendar(key)
      loaded.value = new Map(loaded.value).set(key, activities)
    } catch {
      // only for the month still shown, the user may have moved on
      if (monthKey(shown.value) === key) {
        error.value = 'This month could not be loaded'
      }
    } finally {
      isLoading.value = false
    }
  }
  const move = (months: number) => show(new Date(shown.value.getFullYear(), shown.value.getMonth() + months, 1))
  const backToToday = () => show(new Date(today.getFullYear(), today.getMonth(), 1))

  // the days of the month, after empty cells up to its first day of the week
  const cells = computed(() => {
    const year = shown.value.getFullYear()
    const month = shown.value.getMonth()
    const byDay = new Map<number, CalendarActivity[]>()
    for (const activity of shownActivities.value) {
      const date = new Date(activity.start)
      if (date.getFullYear() === year && date.getMonth() === month) {
        byDay.set(date.getDate(), [...(byDay.get(date.getDate()) ?? []), activity])
      }
    }
    const blanks = (new Date(year, month, 1).getDay() + 6) % 7
    const days = new Date(year, month + 1, 0).getDate()
    return [
      ...Array.from({ length: blanks }, (): null => null),
      ...Array.from({ length: days }, (_, i) => ({
        day: i + 1,
        isToday: isCurrent.value && i + 1 === today.getDate(),
        activities: byDay.get(i + 1) ?? [],
      })),
    ]
  })

  const describe = (a: CalendarActivity) => `${a.title} · ${sportLabel(a.sport)} · ${formatDistance(a.distance)}`
</script>

<template>
  <div>
    <div class="d-flex align-center mb-2">
      <v-btn
        aria-label="Previous month"
        density="comfortable"
        :icon="mdiChevronLeft"
        size="small"
        variant="text"
        @click="move(-1)"
      />
      <span class="text-subtitle-1 font-weight-medium month-title">{{ title }}</span>
      <v-btn
        aria-label="Next month"
        density="comfortable"
        :disabled="isCurrent"
        :icon="mdiChevronRight"
        size="small"
        variant="text"
        @click="move(1)"
      />
      <v-progress-circular
        v-if="isLoading"
        class="ml-2"
        indeterminate
        size="16"
        width="2"
      />
      <v-spacer />
      <v-btn v-if="!isCurrent" size="small" variant="text" @click="backToToday">Today</v-btn>
    </div>
    <v-alert
      v-if="error"
      class="mb-2"
      density="compact"
      type="error"
      variant="tonal"
    >{{ error }}</v-alert>
    <div class="month-grid">
      <div v-for="(day, index) in weekDays" :key="'h' + index" class="text-caption text-medium-emphasis text-center">{{ day }}</div>
      <div v-for="(cell, index) in cells" :key="index" class="day" :class="{ empty: !cell }">
        <template v-if="cell">
          <span class="text-caption" :class="{ today: cell.isToday }">{{ cell.day }}</span>
          <div class="dots">
            <span
              v-for="activity in cell.activities"
              :key="activity.id"
              class="dot"
              :style="{ background: sportColor(activity.sport) }"
              :title="describe(activity)"
              @click="emit('open', activity.id)"
            />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.month-title {
  min-width: 9.5em;
  text-align: center;
}
.month-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
.day {
  min-height: 44px;
  padding: 2px 4px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.03);
}
.day.empty {
  background: none;
}
.today {
  display: inline-block;
  min-width: 20px;
  border-radius: 10px;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  text-align: center;
}
.dots {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 2px;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  cursor: pointer;
}
.dot:hover {
  transform: scale(1.3);
}
</style>
