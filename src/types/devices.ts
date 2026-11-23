// how the altitudes of the activities of a device are corrected:
// none keeps the recorded ones, calibrate shifts the barometer's profile to the ground elevation,
// replace uses the ground elevation under the GPS positions
export type AltitudeCorrection = 'none' | 'calibrate' | 'replace'

// how the files of a device also named it, before it was merged into it
export interface DeviceAlias {
  name: string
  brand: string
  model: string
  serial_number: string
}

// the progress of the analysis of the activities of a device again, with its altitudes setting
export interface RecomputeStatus {
  running: boolean
  total: number
  done: number
  failed: number // their FIT file is missing or can't be read
  started_at: string
  finished_at: string | null
}

// a recording device, created at the import of its first activity. A unit is told apart by its serial
// number; the units whose files don't give it share one device per model, serial_number empty
export interface Device {
  id: string
  name: string // "Garmin Edge 530", as its files name it
  label: string // the name the user gave it, shown in place of name; empty for none
  brand: string
  model: string
  serial_number: string
  altitude_correction: AltitudeCorrection
  activities: number
  last_used: string | null
  software: string // the firmware version of its latest activity, empty when the file doesn't tell
  // the devices merged into it: the same unit, that its files named differently
  aliases: DeviceAlias[]
  // the latest recompute of its activities since the server started, null without
  recompute: RecomputeStatus | null
}
