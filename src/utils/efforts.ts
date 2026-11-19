import type { BestEffort } from '@/types/records'
import { formatPace, formatSpeed, usesPace } from '@/utils/format'

// the names of the running distances, the others are in km
const distanceNames: Record<number, string> = {
  400: '400 m',
  1609.344: '1 mile',
  21097.5: 'Half marathon',
  42195: 'Marathon',
}

// the target of an effort: "5 km", "Marathon", "20 min", "5 s"
export const effortTarget = (kind: string, target: number): string => {
  if (kind === 'distance') {
    return distanceNames[target] ?? `${target / 1000} km`
  }
  if (target < 60) {
    return `${target} s`
  }
  return target < 3600 ? `${target / 60} min` : `${target / 3600} h`
}

// a time in seconds as h:mm:ss, m:ss under an hour, with the tenth under a minute
export const formatEffortTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds.toFixed(1)} s`
  }
  const whole = Math.round(seconds)
  const h = Math.floor(whole / 3600)
  const m = Math.floor((whole % 3600) / 60)
  const s = String(whole % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}

// the value of an effort: its time, or its power
export const effortValue = (effort: BestEffort): string =>
  effort.kind === 'distance' ? formatEffortTime(effort.value) : `${Math.round(effort.value)} W`

// the pace or speed of a distance effort, '' for a power one
export const effortSpeed = (effort: BestEffort): string => {
  if (effort.kind !== 'distance' || effort.value <= 0) {
    return ''
  }
  const speed = effort.target / effort.value
  return usesPace(effort.sport) ? `${formatPace(1000 / 60 / speed)} /km` : formatSpeed(speed)
}

// the colors of the ranks 1 to 3: gold, silver, bronze
export const rankColors = ['#d4a017', '#9e9e9e', '#a1662f']
export const rankColor = (rank: number): string => rankColors[rank - 1] ?? 'grey'

// the key of a target of a sport, to match an effort with its records
export const effortKey = (e: { sport: string, kind: string, target: number }): string =>
  `${e.sport}/${e.kind}/${e.target}`
