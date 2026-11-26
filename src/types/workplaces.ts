// what the user sets of a workplace: its center and the diameter of its circle, in meters. An activity
// starting or ending in the circle is a commute.
export interface WorkplaceInput {
  name: string
  lat: number
  lon: number
  diameter: number
}

export interface Workplace extends WorkplaceInput {
  id: string
  created_at: string
  updated_at: string
}

// the diameters the form offers, in meters (the backend accepts 20 to 5000)
export const WORKPLACE_MIN_DIAMETER = 50
export const WORKPLACE_MAX_DIAMETER = 2000
export const WORKPLACE_DEFAULT_DIAMETER = 300
