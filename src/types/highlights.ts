import type { GoalMetric } from '@/types/goals'

// what an activity achieved, compared with the activities before it (the backend's types.Highlight)
export interface Highlight {
  activity_id: string
  activity_title: string
  date: string
  kind: 'effort' | 'segment' | 'goal'
  sport: string
  // an effort: distance (a time over a distance) or power (a power over a duration)
  effort_kind?: 'distance' | 'power'
  target: number
  // the time of an effort or a pass, the power of a power effort, the value of the metric of a goal
  value: number
  rank: number // at the date of the activity: 1 a new best
  previous: number | null // the best before it
  current: boolean // a best still the best today
  start_offset: number
  segment_id?: string
  goal_id?: string
  name?: string // of the segment or the goal
  metric?: GoalMetric
}
