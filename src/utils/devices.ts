import type { AltitudeCorrection } from '@/types/devices'

export const altitudeCorrections: { value: AltitudeCorrection, title: string, subtitle: string }[] = [
  {
    value: 'none',
    title: 'Recorded altitudes',
    subtitle: 'Kept as the device recorded them',
  },
  {
    value: 'calibrate',
    title: 'Calibrated on the terrain',
    subtitle: 'The barometer\'s profile, shifted to the ground elevation',
  },
  {
    value: 'replace',
    title: 'Terrain elevation',
    subtitle: 'The ground elevation under the GPS positions: without barometer, or a defective one',
  },
]

export const correctionTitle = (correction: AltitudeCorrection): string =>
  altitudeCorrections.find(c => c.value === correction)?.title ?? correction

// "serial 3999999999", or how a unit without one is told
export const unitLabel = (unit: { serial_number: string }): string =>
  unit.serial_number ? `serial ${unit.serial_number}` : 'no serial number'
