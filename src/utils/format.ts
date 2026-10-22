import { mdiBike, mdiHeartPulse, mdiHiking, mdiRun, mdiSwim, mdiWalk } from '@mdi/js'

// distance in meters
export const formatDistance = (meters: number): string =>
  meters >= 100000 ? `${Math.round(meters / 1000)} km` : `${(meters / 1000).toFixed(1)} km`

// duration in seconds, "1h 05" or "42 min"
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return hours > 0 ? `${hours}h ${String(minutes).padStart(2, '0')}` : `${minutes} min`
}

// elevation in meters
export const formatElevation = (meters: number): string => `${Math.round(meters).toLocaleString('fr-FR')} m`

// CO2 mass in grams, shown in kg
export const formatCo2 = (grams: number): string =>
  `${(grams / 1000).toLocaleString('fr-FR', { maximumFractionDigits: grams < 10000 ? 1 : 0 })} kg`

// speed in m/s
export const formatSpeed = (metersPerSecond: number): string => `${(metersPerSecond * 3.6).toFixed(1)} km/h`

export const formatDate = (date: string): string =>
  new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date))

export const sportLabel = (sport: string): string => sport.charAt(0).toUpperCase() + sport.slice(1).replace(/_/g, ' ')

const sportIcons: Record<string, string> = {
  cycling: mdiBike,
  running: mdiRun,
  swimming: mdiSwim,
  walking: mdiWalk,
  hiking: mdiHiking,
}
export const sportIcon = (sport: string): string => sportIcons[sport] ?? mdiHeartPulse

// cycling uses the theme primary color
const sportColors: Record<string, string> = {
  cycling: '#257800',
  running: '#e65100',
  swimming: '#0277bd',
  walking: '#6d4c41',
  hiking: '#8e24aa',
}
const otherColors = ['#546e7a', '#c2185b', '#00897b', '#f9a825']
export const sportColor = (sport: string, index = 0): string => sportColors[sport] ?? otherColors[index % otherColors.length]
