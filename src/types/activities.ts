export type Point = {
  lat: number,
  lon: number
}

export interface Activity {
  id: string
  public_gps_points: Point
  duration: number
  start: number
}
