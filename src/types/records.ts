// the best stretch of an activity, in the sport of its leg for a multisport one: the fastest over a
// distance, or the most powerful over a duration (measured power only)
export interface BestEffort {
  sport: string
  kind: 'distance' | 'power'
  target: number // meters for a distance, seconds for a power
  value: number // seconds for a distance, watts for a power
  start_offset: number // seconds since the start of the activity
}

// a best effort ranked among the ones of the user, with its activity
export interface EffortRecord extends BestEffort {
  rank: number // 1 for the record
  activity_id: string
  activity_title: string
  date: string
}

// what /user/records returns: the top efforts of each target, and the targets measured
export interface Records {
  distances: Record<string, { distances: number[], max_speed: number }> // by sport
  power_durations: number[]
  records: EffortRecord[]
}

// the best power of a ride over a duration, and the second it starts at
export interface PowerCurvePoint {
  duration: number // seconds
  watts: number
  start_offset: number
}

// the best power of the user over a duration of a period, with the ride it comes from
export interface PowerCurveBest extends PowerCurvePoint {
  activity_id: string
  activity_title: string
  date: string
  watts_per_kg: number | null // by the weight at the date of the ride, null when unknown
}

// the 2-parameter model fitted on the 3 to 20 minutes of a curve
export interface CriticalPower {
  cp: number // W
  w_prime: number // J
  r2: number
}

// what /user/powercurve returns
export interface PowerCurve {
  points: PowerCurveBest[]
  critical_power: CriticalPower | null
  ftp: number // the current one, 0 when unknown
  durations: number[]
}
