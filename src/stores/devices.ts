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

  // the name the user gives a device, '' to show the one its files give
  const renameDevice = async (id: string, label: string): Promise<void> => {
    let updated: Device
    try {
      updated = (await api.post(`/api/v1/device/${id}`, { label })).data
    } catch (error) {
      console.error('Rename device error:', error)
      throw new Error(errorMessage(error, 'The device could not be renamed'))
    }
    devices.value = devices.value.map(d => (d.id === id ? updated : d))
  }

  // the same unit, that its files named differently: the activities of id, past and future, go to into.
  // The list is reloaded: id is gone, into has its activities
  const mergeDevice = async (id: string, into: string): Promise<void> => {
    try {
      await api.post(`/api/v1/device/${id}/merge`, { into })
    } catch (error) {
      console.error('Merge device error:', error)
      throw new Error(errorMessage(error, 'The devices could not be merged'))
    }
    await getAllDevices()
  }

  // analyses again the activities of a device with its altitudes setting, in the background: its recompute
  // tells the progress, getAllDevices reads it again
  const recompute = async (id: string): Promise<void> => {
    let updated: Device
    try {
      updated = (await api.post(`/api/v1/device/${id}/recompute`)).data
    } catch (error) {
      console.error('Recompute device error:', error)
      throw new Error(errorMessage(error, 'The activities could not be recomputed'))
    }
    devices.value = devices.value.map(d => (d.id === id ? updated : d))
  }

  return { devices, getAllDevices, setAltitudeCorrection, renameDevice, mergeDevice, recompute }
})
