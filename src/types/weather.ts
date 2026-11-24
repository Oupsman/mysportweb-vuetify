// the weather at the start of an activity, from Open-Meteo (the backend's weather.Weather); a value is null
// when the source doesn't have it
export interface Weather {
  time: string // the hour of the values
  temperature: number | null // °C
  apparent_temperature: number | null // °C, with the wind and the humidity
  humidity: number | null // %
  precipitation: number | null // mm over the hour
  code: number | null // WMO weather code
  cloud_cover: number | null // %
  wind_speed: number | null // km/h
  wind_gusts: number | null // km/h
  wind_direction: number | null // degrees it comes from, 0 the north
  source: string
  unavailable?: boolean // the source has none for that hour and place
}
