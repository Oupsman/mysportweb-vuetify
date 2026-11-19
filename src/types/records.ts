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
