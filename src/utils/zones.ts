// the heart rate zones, by heart rate reserve (computed by the backend): the usual gray, blue, green, orange,
// red of the sport watches, from the easiest to the hardest
export const hrZones = [
  { name: 'Z1', label: 'Recovery', color: '#9e9e9e' },
  { name: 'Z2', label: 'Endurance', color: '#2a78d6' },
  { name: 'Z3', label: 'Tempo', color: '#2e9d4f' },
  { name: 'Z4', label: 'Threshold', color: '#f29d0c' },
  { name: 'Z5', label: 'VO2max', color: '#d63a2a' },
]

export interface Zone {
  name: string
  label: string
  color: string
}

// Coggan's power zones, by FTP (computed by the backend), from the easiest to the hardest
export const powerZones: Zone[] = [
  { name: 'Z1', label: 'Recovery', color: '#9e9e9e' },
  { name: 'Z2', label: 'Endurance', color: '#2a78d6' },
  { name: 'Z3', label: 'Tempo', color: '#2e9d4f' },
  { name: 'Z4', label: 'Threshold', color: '#e8c20c' },
  { name: 'Z5', label: 'VO2max', color: '#f2790c' },
  { name: 'Z6', label: 'Anaerobic', color: '#d63a2a' },
  { name: 'Z7', label: 'Neuromuscular', color: '#8e3ab8' },
]

// the watts range of a power zone from the bounds of an activity: 0, the lower limits of the zones 2 to 7
export const powerZoneRange = (bounds: number[], zone: number): string => {
  if (zone === 0) return `< ${bounds[1]} W`
  if (zone === powerZones.length - 1) return `≥ ${bounds[zone]} W`
  return `${bounds[zone]}–${bounds[zone + 1] - 1} W`
}

// the bpm range of a zone from the bounds of an activity: rest, the lower limits of the zones 2 to 5, max
export const zoneRange = (bounds: number[], zone: number): string => {
  if (zone === 0) return `< ${bounds[1]} bpm`
  if (zone === hrZones.length - 1) return `≥ ${bounds[zone]} bpm`
  return `${bounds[zone]}–${bounds[zone + 1] - 1} bpm`
}

// the range of a zone as percentages (of the heart rate reserve, of the FTP), from the lower limits of the
// zones after the first
export const zonePercent = (limits: number[], zone: number): string => {
  const pct = (x: number) => `${Math.round(x * 100)}%`
  if (zone === 0) return `< ${pct(limits[0])}`
  if (zone === limits.length) return `≥ ${pct(limits[zone - 1])}`
  return `${pct(limits[zone - 1])}–${pct(limits[zone])}`
}
