import {
  mdiWeatherCloudy, mdiWeatherFog, mdiWeatherHail, mdiWeatherLightningRainy, mdiWeatherPartlyCloudy,
  mdiWeatherPouring, mdiWeatherRainy, mdiWeatherSnowy, mdiWeatherSnowyHeavy, mdiWeatherSunny,
} from '@mdi/js'

// the WMO weather codes Open-Meteo gives: a description and an icon
const conditions: [number[], string, string][] = [
  [[0], 'Clear sky', mdiWeatherSunny],
  [[1], 'Mainly clear', mdiWeatherSunny],
  [[2], 'Partly cloudy', mdiWeatherPartlyCloudy],
  [[3], 'Overcast', mdiWeatherCloudy],
  [[45, 48], 'Fog', mdiWeatherFog],
  [[51, 53, 55], 'Drizzle', mdiWeatherRainy],
  [[56, 57], 'Freezing drizzle', mdiWeatherRainy],
  [[61], 'Light rain', mdiWeatherRainy],
  [[63], 'Rain', mdiWeatherRainy],
  [[65], 'Heavy rain', mdiWeatherPouring],
  [[66, 67], 'Freezing rain', mdiWeatherHail],
  [[71], 'Light snow', mdiWeatherSnowy],
  [[73], 'Snow', mdiWeatherSnowy],
  [[75, 77], 'Heavy snow', mdiWeatherSnowyHeavy],
  [[80, 81], 'Rain showers', mdiWeatherRainy],
  [[82], 'Violent rain showers', mdiWeatherPouring],
  [[85, 86], 'Snow showers', mdiWeatherSnowy],
  [[95], 'Thunderstorm', mdiWeatherLightningRainy],
  [[96, 99], 'Thunderstorm with hail', mdiWeatherHail],
]

export const weatherCondition = (code: number | null): { text: string, icon: string } => {
  const found = conditions.find(([codes]) => code !== null && codes.includes(code))
  return found ? { text: found[1], icon: found[2] } : { text: 'Weather', icon: mdiWeatherPartlyCloudy }
}

const points = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

// where the wind comes from: "NW" for 315°
export const compassPoint = (degrees: number): string => points[Math.round(((degrees % 360) + 360) % 360 / 45) % 8]
