import { ref } from 'vue'
import type { Ref } from 'vue'
import { defineStore } from 'pinia'

import { api, errorMessage } from '@/api'
import type { AltitudeCorrection, Device } from '@/types/devices'

export const useDevicesStore = defineStore('devices', () => {
  // the latest used first
  const devices: Ref<Device[]> = ref([])

  const getAllDevices = async (): Promise<void> => {
    try {
      const response = await api.get('/api/v1/device/all')
      devices.value = response.data ?? []
    } catch (error) {
      console.error('Get all devices error:', error)
      throw new Error(errorMessage(error, 'The devices could not be loaded'))
    }
  }

  const setAltitudeCorrection = async (id: string, correction: AltitudeCorrection): Promise<void> => {
    let updated: Device
    try {
      updated = (await api.post(`/api/v1/device/${id}`, { altitude_correction: correction })).data
    } catch (error) {
      console.error('Update device error:', error)
      throw new Error(errorMessage(error, 'The device could not be saved'))
    }
    devices.value = devices.value.map(d => (d.id === id ? updated : d))
  }

  return { devices, getAllDevices, setAltitudeCorrection }
})
