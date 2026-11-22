// the seconds spent in each heart rate zone during a week (week: its Monday, YYYY-MM-DD)
export interface WeeklyHrZones {
  week: string
  zones: number[] // seconds, zone 1 to 5
}

// the time in heart rate zones per week, with the limits of the zones as fractions of the heart rate reserve
export interface HrZonesWeeks {
  limits: number[] // lower limits of the zones 2 to 5
  weeks: WeeklyHrZones[]
}

// the FTP of the user: the one they set (0: estimated), and the one estimated from their rides of the last
// window_days (95% of their best 20 minutes), null without power data
export interface FTPInfo {
  ftp: number
  estimated: { ftp: number, best_20min: number, activity_id: string, date: string } | null
  window_days: number
  zone_limits: number[] // lower limits of the power zones 2 to 7, fractions of the FTP
}

// the training state at the end of a day (YYYY-MM-DD), in training load units; the form is the one of
// its morning, before its load
export interface ReadinessDay {
  date: string
  load: number
  fitness: number // average load of the last 42 days
  fatigue: number // average load of the last 7 days
  form: number // fitness - fatigue of the day before
}

export type ReadinessStatus = 'not_enough_data' | 'fresh' | 'neutral' | 'productive' | 'overreaching'
export type ReadinessFlag = 'elevated_rest_hr' | 'load_spike'

export interface ReadinessToday extends ReadinessDay {
  acwr: number | null // fatigue / fitness
  // resting heart rate averages of the last 7 days and of the 30 days before them, bpm
  rest_hr_7d: number | null
  rest_hr_30d: number | null
  rest_hr_delta: number | null // null without enough measures
  status: ReadinessStatus
  flags: ReadinessFlag[]
}

export interface Readiness {
  series: ReadinessDay[]
  today: ReadinessToday
}
