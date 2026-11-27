import type { BestEffort, PowerCurvePoint } from '@/types/records'
import type { Weather } from '@/types/weather'

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

// a stretch during which a rear radar saw vehicles behind the rider
export interface RadarEvent {
  offset: number // seconds since the start, at its first record
  duration: number // seconds
  threat: number // the highest threat level: 1 approaching, 2 approaching fast, 3 critical
  vehicles: number // the most vehicles tracked at once
  // meters behind the rider of the nearest vehicle when the threat was highest: how far behind, not how
  // close it passed; 0 when the radar gave none
  distance: number
  position: Point | null // where the threat was highest, null without GPS fix
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
  // the name the owner gave the device, shown in place of device_name; empty for none, and for the others
  device_label?: string
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
  // seconds in each power zone (Z1 to Z7) of a ride with a power meter, zeros without, null until computed;
  // the watts bounding them: 0, the lower limits of the zones 2 to 7, null without FTP; the FTP used (0: none)
  power_zones: number[] | null
  power_zone_bounds: number[] | null
  ftp: number
  // normalized power (W), intensity factor, TSS: null without a power meter or FTP
  normalized_power: number | null
  intensity: number | null
  tss: number | null
  // where trimp comes from: the device, the TSS of the power, the TRIMP of the heart rate; '' when older
  score_source: '' | 'device' | 'power' | 'hr'
  // the best power over durations from 1 s to 5 h of a ride with a power meter, empty without, null until computed
  power_curve: PowerCurvePoint[] | null
  // the fastest stretches over distances and the best powers over durations, empty without any, null until
  // the backend computed them
  best_efforts: BestEffort[] | null
  // the seconds spent moving and the average speed then (m/s), from the records: a device without auto-pause
  // counts the stops in its duration; null until computed, 0 when the records don't tell
  moving_time: number | null
  avg_moving_speed: number | null
  // the weather at its start, null until the backend got it
  weather: Weather | null
  // the vehicles a rear radar saw behind the rider (EIradar on a Karoo): the owner's only, null for the
  // others and until computed, empty without radar
  radar_events: RadarEvent[] | null
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
  // while moving: they compare on them (utils/moving); null until computed, 0 when unknown
  moving_time?: number | null
  avg_moving_speed?: number | null
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
  thumbnail: string // the URL of its thumbnail, '' without map
  cheer_count: number
  comment_count: number
}

// a row of the activities table, with the measures the user may show as columns
export interface ActivitySearchRow extends ActivityRow {
  moving_time: number | null // seconds, null until computed, 0 when the records don't tell
  avg_moving_speed: number | null // m/s, the same
  max_speed: number // m/s
  descent: number // meters
  // 0 when not recorded
  avg_hr: number
  power_avg: number // watts
  avg_rpm: number
  kcal: number
  co2: number // grams saved by a commute
}

export interface ActivitySearch {
  activities: ActivitySearchRow[]
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
