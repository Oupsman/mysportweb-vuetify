export type GoalMetric = 'distance' | 'duration' | 'elevation' | 'activities'
export type GoalPeriodKind = 'week' | 'month' | 'year' | 'custom'
export type GoalState = 'reached' | 'ahead' | 'behind' | 'upcoming' | 'missed'

// what the user sets of a goal: target in meters (distance, elevation), seconds (duration) or a count;
// starts_on and ends_on (YYYY-MM-DD, included) for a custom period
export interface GoalInput {
  name: string
  metric: GoalMetric
  target: number
  sports: string[] // none: all sports
  period: GoalPeriodKind
  starts_on: string | null
  ends_on: string | null
}

// a period of a goal, its first and last days included
export interface GoalPeriod {
  start: string
  end: string
  value: number
  reached: boolean
}

// a goal with its progress: the current period, the value expected by now at a steady pace, what is left
// per day (today included) to reach it, the past periods of a recurring goal (oldest first), the periods
// reached in a row
export interface Goal extends GoalInput {
  id: string
  created_at: string
  current: GoalPeriod
  state: GoalState
  expected: number
  days_left: number
  per_day: number
  history: GoalPeriod[]
  streak: number
}
