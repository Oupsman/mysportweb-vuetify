import type { Reminder, ReminderFields, ReminderState, ReminderUnit } from '@/types/equipments'
import { formatDistance } from '@/utils/format'

export const reminderUnits: { value: ReminderUnit, title: string }[] = [
  { value: 'day', title: 'Days' },
  { value: 'week', title: 'Weeks' },
  { value: 'month', title: 'Months' },
  { value: 'year', title: 'Years' },
]

const km = (value: number) => formatDistance(value * 1000)
const hours = (value: number) => `${Number(value.toFixed(1)).toLocaleString('fr-FR')} h`

// "1 week", "3 months"
export const timeInterval = (count: number, unit: string): string => `${count} ${unit}${count > 1 ? 's' : ''}`

// a due date (YYYY-MM-DD, a day of the user's timezone): today, tomorrow, or the date
export const formatDueDate = (date: string): string => {
  const day = (offset: number) => {
    const d = new Date()
    d.setDate(d.getDate() + offset)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  if (date === day(0)) {
    return 'today'
  }
  if (date === day(1)) {
    return 'tomorrow'
  }
  if (date === day(-1)) {
    return 'yesterday'
  }
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${date}T00:00:00Z`))
}

// its intervals: "every 3000 km or 1 month"
export const intervalText = (r: ReminderFields): string => {
  const parts: string[] = []
  if (r.every_km > 0) {
    parts.push(km(r.every_km))
  }
  if (r.every_hours > 0) {
    parts.push(hours(r.every_hours))
  }
  if (r.every_count > 0 && r.every_unit) {
    parts.push(timeInterval(r.every_count, r.every_unit))
  }
  return parts.length ? `every ${parts.join(' or ')}` : 'no interval'
}

// where its cycle is: "in 250 km or on 08/03/2026", "120 km overdue", "due at the next ride"
export const reminderStatusText = (r: Reminder): string => {
  if (r.state === 'due') {
    const late: string[] = []
    if (r.km_left !== null && r.km_left <= 0) {
      late.push(r.km_left < 0 ? `${km(-r.km_left)} overdue` : 'due now')
    }
    if (r.hours_left !== null && r.hours_left <= 0) {
      late.push(r.hours_left < 0 ? `${hours(-r.hours_left)} overdue` : 'due now')
    }
    if (late.length === 0 && r.due_date) {
      const when = formatDueDate(r.due_date)
      late.push(when === 'today' ? 'due today' : `due since ${when}`)
    }
    return late.length ? [...new Set(late)].join(', ') : 'due'
  }
  if (r.waiting_use) {
    return 'due at the next use'
  }
  const next: string[] = []
  if (r.km_left !== null) {
    next.push(`in ${km(r.km_left)}`)
  }
  if (r.hours_left !== null) {
    next.push(`in ${hours(r.hours_left)}`)
  }
  if (r.due_date) {
    const when = formatDueDate(r.due_date)
    next.push(/^\d/.test(when) ? `on ${when}` : when)
  }
  return next.join(' or ')
}

export const reminderColor = (state: ReminderState): string =>
  state === 'due' ? 'error' : (state === 'soon' ? 'warning' : 'primary')

// examples to start from
export const reminderPresets: ReminderFields[] = [
  { name: 'Check the tire pressure', every_km: 0, every_hours: 0, every_count: 1, every_unit: 'week', only_when_used: true },
  { name: 'Clean and lube the transmission', every_km: 0, every_hours: 0, every_count: 1, every_unit: 'month', only_when_used: true },
  { name: 'Change the chain', every_km: 3000, every_hours: 0, every_count: 0, every_unit: '', only_when_used: true },
  { name: 'Change the tires', every_km: 5000, every_hours: 0, every_count: 0, every_unit: '', only_when_used: true },
  { name: 'Suspension service', every_km: 0, every_hours: 50, every_count: 1, every_unit: 'year', only_when_used: false },
  { name: 'Full service', every_km: 0, every_hours: 0, every_count: 1, every_unit: 'year', only_when_used: false },
  { name: 'Replace the shoes', every_km: 800, every_hours: 0, every_count: 0, every_unit: '', only_when_used: true },
]
