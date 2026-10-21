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
