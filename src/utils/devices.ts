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

// how a device is shown: the name the user gave it, else the one its files give
export const deviceName = (device: { name: string, label: string }): string => device.label || device.name

// the longest name a user may give a device, in characters (models.MaxDeviceLabel)
export const maxDeviceLabel = 64

// "serial 3999999999", or how a unit without one is told
export const unitLabel = (unit: { serial_number: string }): string =>
  unit.serial_number ? `serial ${unit.serial_number}` : 'no serial number'
