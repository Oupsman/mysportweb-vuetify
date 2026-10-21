// distances and elevations in meters, durations in seconds
export interface PeriodTotals {
  activities: number
  distance: number
  duration: number
  elevation: number
}

export interface WeeklyVolume {
  week: string // its Monday, YYYY-MM-DD
  sport: string
  activities: number
  distance: number
  duration: number
}

export interface SportRecord {
  id: string
  title: string
  date: string
  value: number
}

export interface SportSummary {
  sport: string
  totals: PeriodTotals
  longest_distance: SportRecord | null
  longest_duration: SportRecord | null
  biggest_climb: SportRecord | null
}

export interface RecentActivity {
  id: string
  title: string
  date: string
  sport: string
  distance: number
  duration: number
  avg_speed: number
  elevation: number
}

export interface CalendarActivity {
  id: string
  title: string
  start: string
  sport: string
  distance: number
  duration: number
}

export interface Dashboard {
  totals: {
    this_week: PeriodTotals
    last_week: PeriodTotals
    this_month: PeriodTotals
    last_month: PeriodTotals
    this_year: PeriodTotals
    all_time: PeriodTotals
  }
  week_starts: string[]
  weekly: WeeklyVolume[]
  sports: SportSummary[]
  recent: RecentActivity[]
  calendar: CalendarActivity[]
  nb_equipments: number
  timezone: string
}
