import type { Point, RadarEvent } from '@/types/activities'
import { formatClock } from '@/utils/format'

// the threat levels drawn on the map: every vehicle behind the rider, the ones closing in fast bigger
export const RADAR_MIN_THREAT = 1

export const radarThreatLabels: Record<number, string> = {
  1: 'Vehicle approaching',
  2: 'Vehicle approaching fast',
  3: 'Critical',
}

export const radarThreatColors: Record<number, string> = {
  1: '#fbc02d',
  2: '#f57c00',
  3: '#c62828',
}

// the levels the user shows or hides apart: the vehicles approaching, the ones approaching fast (and the
// critical ones, a level no radar was seen sending)
export type RadarLevel = 'approaching' | 'fast'
export const radarLevel = (threat: number): RadarLevel => threat >= 2 ? 'fast' : 'approaching'

// the radius of the marker of an event (px): an approaching vehicle smaller than one closing in fast
export const radarMarkerRadius = (threat: number): number => threat >= 2 ? 8 : 6

// the events drawn on the map, with their position; the most threatening last, drawn over the others
export const drawnRadarEvents = (events: RadarEvent[] | null | undefined): (RadarEvent & { position: Point })[] =>
  (events ?? [])
    .filter((e): e is RadarEvent & { position: Point } => e.threat >= RADAR_MIN_THREAT && e.position !== null)
    .sort((a, b) => a.threat - b.threat)

// the text of the marker of an event: what, when (time of the day, from the start of the activity), how long
export const radarEventLabel = (event: RadarEvent, activityStart: Date): string => {
  const at = new Date(activityStart.getTime() + event.offset * 1000)
  const lines = [
    radarThreatLabels[event.threat] ?? `Threat ${event.threat}`,
    `${at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} (${formatClock(event.offset)} into the ride)`,
    `${event.vehicles} vehicle${event.vehicles > 1 ? 's' : ''} behind, for ${formatClock(event.duration)}`,
  ]
  if (event.distance > 0) {
    lines.push(`nearest ${event.distance} m behind when the alert was highest`)
  }
  return lines.join('<br>')
}
