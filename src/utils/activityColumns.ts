import type { ActivitySearchRow } from '@/types/activities'
import { formatCo2, formatDistance, formatDuration, formatElevation, formatSpeed } from '@/utils/format'

// the columns of the activities table the user may show, in their default order: key the sort key of the
// server (sortable ones), menu the name in the columns menu when the header has none or a short one. format:
// the text of a cell, '—' when the activity doesn't have the measure; the others have their own template.
export interface ActivityColumn {
  key: string
  title: string
  menu?: string
  align?: 'start' | 'end'
  sortable: boolean
  width?: number
  format?: (a: ActivitySearchRow) => string
}

const none = '—'
const known = (value: number | null, format: (v: number) => string) => value ? format(value) : none

export const activityColumns: ActivityColumn[] = [
  { key: 'sport', title: '', menu: 'Map and sport', sortable: false, width: 88 },
  { key: 'date', title: 'Date', sortable: true },
  { key: 'title', title: 'Title', sortable: true },
  { key: 'distance', title: 'Distance', align: 'end', sortable: true, format: a => formatDistance(a.distance) },
  { key: 'duration', title: 'Time', menu: 'Time (elapsed)', align: 'end', sortable: true, format: a => formatDuration(a.duration) },
  { key: 'moving_time', title: 'Moving time', align: 'end', sortable: true, format: a => known(a.moving_time, v => formatDuration(Math.round(v))) },
  { key: 'speed', title: 'Speed', menu: 'Speed (average)', align: 'end', sortable: true, format: a => formatSpeed(a.avg_speed) },
  { key: 'moving_speed', title: 'Moving speed', align: 'end', sortable: true, format: a => known(a.avg_moving_speed, formatSpeed) },
  { key: 'max_speed', title: 'Max speed', align: 'end', sortable: true, format: a => known(a.max_speed, formatSpeed) },
  { key: 'elevation', title: 'Elevation', menu: 'Elevation gain', align: 'end', sortable: true, format: a => formatElevation(a.elevation) },
  { key: 'descent', title: 'Descent', align: 'end', sortable: true, format: a => known(a.descent, formatElevation) },
  { key: 'avg_hr', title: 'Avg HR', menu: 'Heart rate (average)', align: 'end', sortable: true, format: a => known(a.avg_hr, v => `${v} bpm`) },
  { key: 'power', title: 'Avg power', menu: 'Power (average)', align: 'end', sortable: true, format: a => known(a.power_avg, v => `${v} W`) },
  { key: 'cadence', title: 'Cadence', menu: 'Cadence (average)', align: 'end', sortable: true, format: a => known(a.avg_rpm, v => `${v} rpm`) },
  { key: 'calories', title: 'Calories', align: 'end', sortable: true, format: a => known(a.kcal, v => `${v} kcal`) },
  { key: 'co2', title: 'CO₂ saved', align: 'end', sortable: true, format: a => known(a.co2, formatCo2) },
  { key: 'equipment', title: 'Equipment', sortable: false },
  { key: 'device', title: 'Device', sortable: false, format: a => a.device_name || none },
  { key: 'commute', title: 'Commute', sortable: false },
]

export const activityColumn = new Map(activityColumns.map(c => [c.key, c]))

// the table needs a column to tell the activities apart
export const requiredColumn = 'title'

export const defaultColumns = (): string[] =>
  ['sport', 'date', 'title', 'distance', 'duration', 'speed', 'elevation', 'equipment']

// the saved columns with what the application knows: the ones gone dropped, each once, the title always.
// null: the default columns.
export const mergeColumns = (saved: string[] | null): string[] => {
  if (!saved) {
    return defaultColumns()
  }
  const columns = [...new Set(saved.filter(key => activityColumn.has(key)))]
  if (!columns.includes(requiredColumn)) {
    columns.unshift(requiredColumn)
  }
  return columns
}

export const sameColumns = (a: string[], b: string[]): boolean =>
  a.length === b.length && a.every((key, i) => key === b[i])
