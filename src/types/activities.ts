import type { BestEffort } from '@/types/records'

export type Point = {
  lat: number,
  lon: number
}

// as returned by the activities list and the dashboard
export interface ActivitySummary {
  id: string
  title: string
  date: string
  sport: string
  thumbnail: string
}

// as returned by the dashboard calendar
export interface ActivityCalendar {
  id: string
  title: string
  start: string
  duration: number
}

// fields of the activity edit form
export interface ActivityUpdate {
  id: string
  title: string
  can_comments: boolean
  visibility: number
  is_commute: boolean
  equipment_id: string | null
}

// a session of a multi-session activity (triathlon...); the transitions are in the leg after them
export interface Leg {
  sport: string
  start_offset: number // seconds since the start of the activity
  duration: number // seconds
  distance: number // meters
  avg_speed: number // m/s
  max_speed: number
  avg_hr: number
  max_hr: number
  avg_cadence: number
  avg_power: number
  power_estimated: boolean // from the speed and the slope, without power meter
  kcal: number
  ascent: number
  descent: number
  transition_time: number // seconds of the transitions just before the leg
}

export interface Activity extends ActivityUpdate {
  user_id: number
  date: string
  sport: string
  duration: number
  distance: number
  avg_speed: number
  public_gps_points: Point[] | null
  gps_points: Point[] | null
  route_id: string | null
  legs: Leg[] | null // null or empty for a single-session activity
  // the recording device, as its FIT file tells; device_name is empty when it doesn't
  device: { brand: string, model: string, serial_number: string, software: string }
  device_name: string
  // seconds since the start of every record
  time_stamps: string[] | null
  dist_array: number[] | null
  gps_time_stamps: number[] | null
  // seconds since the start after which the recording is ignored, 0 when the activity isn't trimmed
  trim_end: number
  // seconds of the whole recording, trimmed or not; 0 for the activities imported before it was stored
  recorded_duration: number
  // training score: the device's (training load, TSS), else the TRIMP of the heart rates; null until computed
  trimp: number | null
  // seconds in each heart rate reserve zone (Z1 to Z5), zeros without heart rate, null until computed;
  // the heart rates bounding them: rest, lower limits of the zones 2 to 5, max; null without heart rate
  hr_zones: number[] | null
  hr_zone_bounds: number[] | null
  // the fastest stretches over distances and the best powers over durations, empty without any, null until
  // the backend computed them
  best_efforts: BestEffort[] | null
}

// the route of an activity; the activities of a commute route, including the ones imported later, are commutes
export interface Route {
  id: string
  name: string
  sport: string
  distance: number
  activity_count: number
  is_commute: boolean
}

// an activity on the same route, as returned by /activity/:id/similar
export interface SimilarActivity {
  id: string
  title: string
  date: string
  distance: number
  duration: number
  avg_speed: number
}

// a row of the activities table, from /activity/search
export interface ActivityRow {
  id: string
  title: string
  date: string
  sport: string
  distance: number
  duration: number
  avg_speed: number
  elevation: number
  is_commute: boolean
  equipment_id: string | null
  equipment_name: string | null
  device_name: string // the recording device, empty when its file doesn't tell
}

export interface ActivitySearch {
  activities: ActivityRow[]
  total: number
  totals: { activities: number, distance: number, duration: number, elevation: number }
  sports: string[]
  years: number[]
  // the user's recording devices, most used first; serial_number tells apart the units of a model
  devices: { id: string, name: string, serial_number: string, activities: number }[]
}

// an activity of a group of duplicates, imported_at telling which copy came first
export interface DuplicateActivity extends ActivityRow {
  imported_at: string
}

// activities of the same sport recorded at the same time; identical ones start at the same second
// (the same file imported twice), the others may be the same activity recorded by two devices
export interface DuplicateGroup {
  identical: boolean
  activities: DuplicateActivity[]
}
