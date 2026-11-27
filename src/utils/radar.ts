import type { Point, RadarEvent } from '@/types/activities'
import { formatClock } from '@/utils/format'

// the threat levels drawn on the map: the vehicles closing in fast. A vehicle merely behind the rider
// (approaching) is in every ride on a road, the map would be covered with them
export const RADAR_MIN_THREAT = 2

export const radarThreatLabels: Record<number, string> = {
  1: 'Vehicle approaching',
  2: 'Vehicle approaching fast',
  3: 'Critical',
}

export const radarThreatColors: Record<number, string> = {
  2: '#f57c00',
  3: '#c62828',
}

// the events drawn on the map, with their position
export const drawnRadarEvents = (events: RadarEvent[] | null | undefined): (RadarEvent & { position: Point })[] =>
  (events ?? []).filter((e): e is RadarEvent & { position: Point } => e.threat >= RADAR_MIN_THREAT && e.position !== null)

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
