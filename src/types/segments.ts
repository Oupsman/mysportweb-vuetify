import type { Point } from '@/types/activities'

// a stretch of a ride the user selected
export interface Segment {
  id: string
  name: string
  sport: string
  points: Point[]
  distance: number // meters
  elevation_gain: number // meters
  created_at: string
  source_activity_id: string | null
}

// a segment of the list, with its passes
export interface SegmentSummary {
  id: string
  name: string
  sport: string
  distance: number
  elevation_gain: number
  efforts: number
  best: number | null // seconds
  best_date: string | null
  last_date: string | null
}

// a pass of an activity on a segment, ranked among the passes on it
export interface SegmentEffort {
  id: string
  segment_id: string
  activity_id: string
  start_offset: number // seconds since the start of the activity
  elapsed: number // seconds
  avg_heart_rate: number | null
  avg_power: number | null
  rank: number
  efforts: number // the passes on the segment
  activity_title: string
  date: string
  segment_name: string
  distance: number // of the segment, meters
}
