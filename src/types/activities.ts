export interface Activity {
  id: string
  public_gps_points: Point
}

export type Point = {
  lat: number,
  lon: number
}
