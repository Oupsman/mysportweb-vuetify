// how the altitudes of the activities of a device are corrected:
// none keeps the recorded ones, calibrate shifts the barometer's profile to the ground elevation,
// replace uses the ground elevation under the GPS positions
export type AltitudeCorrection = 'none' | 'calibrate' | 'replace'

// a recording device, created at the import of its first activity. A unit is told apart by its serial
// number; the units whose files don't give it share one device per model, serial_number empty
export interface Device {
  id: string
  name: string // "Garmin Edge 530"
  brand: string
  model: string
  serial_number: string
  altitude_correction: AltitudeCorrection
  activities: number
  last_used: string | null
  software: string // the firmware version of its latest activity, empty when the file doesn't tell
}
