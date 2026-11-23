import type { Goal, GoalInput, GoalMetric, GoalPeriodKind, GoalState } from '@/types/goals'
import { formatDate, formatDistance, formatDuration, formatElevation, sportLabel } from '@/utils/format'

// the metrics, and the unit the user types their target in: the backend takes meters, seconds or a count
export const goalMetrics: { value: GoalMetric, title: string, unit: string, factor: number }[] = [
  { value: 'distance', title: 'Distance', unit: 'km', factor: 1000 },
  { value: 'duration', title: 'Time', unit: 'hours', factor: 3600 },
  { value: 'elevation', title: 'Elevation', unit: 'm', factor: 1 },
  { value: 'activities', title: 'Activities', unit: 'activities', factor: 1 },
]
export const metricOf = (metric: GoalMetric) => goalMetrics.find(m => m.value === metric)!

export const goalPeriods: { value: GoalPeriodKind, title: string }[] = [
  { value: 'week', title: 'Every week' },
  { value: 'month', title: 'Every month' },
  { value: 'year', title: 'Every year' },
  { value: 'custom', title: 'Between two dates' },
]

export const formatGoalValue = (metric: GoalMetric, value: number): string => {
  switch (metric) {
    case 'distance': return formatDistance(value)
    case 'duration': return formatDuration(value)
    case 'elevation': return formatElevation(value)
    default: return `${Math.round(value)} ${Math.round(value) === 1 ? 'activity' : 'activities'}`
  }
}

// what it counts and when: "Cycling and running, every week", "All sports, 01/03/2026 to 01/06/2026"
export const describeGoal = (goal: GoalInput): string => {
  const sports = goal.sports.length ? goal.sports.map(sportLabel) : ['All sports']
  const what = sports.length > 1 ? `${sports.slice(0, -1).join(', ')} and ${sports[sports.length - 1]}` : sports[0]
  if (goal.period === 'custom' && goal.starts_on && goal.ends_on) {
    return `${what}, ${formatDate(goal.starts_on)} to ${formatDate(goal.ends_on)}`
  }
  return `${what}, ${goalPeriods.find(p => p.value === goal.period)?.title.toLowerCase()}`
}

// the title of a goal: its name, else its target
export const goalTitle = (goal: Goal): string =>
  goal.name || `${formatGoalValue(goal.metric, goal.target)} ${goal.metric === 'activities' ? '' : metricOf(goal.metric).title.toLowerCase()}`.trim()

export const goalStates: Record<GoalState, { label: string, color: string }> = {
  reached: { label: 'Reached', color: 'success' },
  ahead: { label: 'On track', color: 'info' },
  behind: { label: 'Behind', color: 'warning' },
  upcoming: { label: 'Not started', color: 'grey' },
  missed: { label: 'Missed', color: 'error' },
}

export const percent = (value: number, target: number): number => target > 0 ? Math.min(100, value / target * 100) : 0

// the label of a past period: the week of its Monday, the month, the year
export const periodLabel = (period: GoalPeriodKind, start: string): string => {
  const date = new Date(`${start}T00:00:00`)
  switch (period) {
    case 'week': return `Week of ${new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' }).format(date)}`
    case 'month': return new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' }).format(date)
    default: return start.slice(0, 4)
  }
}

// how far the goal is from its steady pace, e.g. "12.5 km ahead of pace"
export const paceText = (goal: Goal): string => {
  switch (goal.state) {
    case 'reached': return goal.current.value > goal.target
      ? `${formatGoalValue(goal.metric, goal.current.value - goal.target)} over the target`
      : 'Target met'
    case 'upcoming': return `Starts on ${formatDate(goal.current.start)}`
    case 'missed': return `Ended on ${formatDate(goal.current.end)}, ${formatGoalValue(goal.metric, goal.target - goal.current.value)} short`
  }
  const gap = Math.abs(goal.current.value - goal.expected)
  return `${formatGoalValue(goal.metric, gap)} ${goal.state === 'ahead' ? 'ahead of' : 'behind'} pace`
}

// what is left to do, per day or per week when more than two weeks are left
export const leftText = (goal: Goal): string => {
  if (goal.per_day <= 0 || goal.days_left <= 0) {
    return ''
  }
  const days = goal.days_left
  const inDays = `in ${days} day${days > 1 ? 's' : ''}`
  if (goal.metric === 'activities') {
    return `${formatGoalValue('activities', Math.ceil(goal.target - goal.current.value))} more ${inDays}`
  }
  if (days > 14) {
    return `${formatGoalValue(goal.metric, goal.per_day * 7)} per week for ${Math.round(days / 7)} weeks`
  }
  return `${formatGoalValue(goal.metric, goal.per_day)} per day for ${days} day${days > 1 ? 's' : ''}`
}
