import { ref } from 'vue'
import type { Ref } from 'vue'
import { defineStore } from 'pinia'

import { api, errorMessage } from '@/api'
import type { Equipment, EquipmentFields } from '@/types/equipments'

export const useEquipmentsStore = defineStore('equipments', () => {
  // with their totals, the default one first
  const equipments: Ref<Equipment[]> = ref([])

  const getAllEquipments = async (): Promise<void> => {
    try {
      const response = await api.get('/api/v1/equipment/all')
      equipments.value = response.data ?? []
    } catch (error) {
      console.error('Get all equipments error:', error)
      throw new Error(errorMessage(error, 'The equipments could not be loaded'))
    }
  }

  const getEquipment = async (id: string): Promise<Equipment> => {
    try {
      const response = await api.get(`/api/v1/equipment/${id}`)
      return response.data
    } catch (error) {
      console.error('Get equipment error:', error)
      throw new Error(errorMessage(error, 'The equipment could not be loaded'))
    }
  }

  // the list is reloaded after each change: setting a default one changes the others
  // returns the id of the new equipment
  const insertEquipment = async (equipment: EquipmentFields): Promise<string> => {
    let id: string
    try {
      id = (await api.post('/api/v1/equipment', equipment)).data.id
    } catch (error) {
      console.error('Create equipment error:', error)
      throw new Error(errorMessage(error, 'The equipment could not be created'))
    }
    await getAllEquipments()
    return id
  }

  const updateEquipment = async (id: string, equipment: EquipmentFields): Promise<void> => {
    try {
      await api.post(`/api/v1/equipment/${id}`, equipment)
    } catch (error) {
      console.error('Update equipment error:', error)
      throw new Error(errorMessage(error, 'The equipment could not be saved'))
    }
    await getAllEquipments()
  }

  const setDefault = (equipment: Equipment): Promise<void> =>
    updateEquipment(equipment.id, { ...equipment, is_default: true })

  // gives the commute equipment to the commute rides recorded before, returns how many changed
  const assignToCommutes = async (id: string): Promise<number> => {
    let updated: number
    try {
      updated = (await api.post(`/api/v1/equipment/${id}/commutes`)).data.updated
    } catch (error) {
      console.error('Assign commute equipment error:', error)
      throw new Error(errorMessage(error, 'The commute rides could not be updated'))
    }
    await getAllEquipments()
    return updated
  }

  // the backend turns the picture upright, scales it down and drops its metadata (where the photo was taken)
  const uploadPicture = async (id: string, file: File): Promise<void> => {
    const form = new FormData()
    form.append('file', file)
    try {
      await api.post(`/api/v1/equipment/${id}/picture`, form)
    } catch (error) {
      console.error('Upload equipment picture error:', error)
      throw new Error(errorMessage(error, 'The picture could not be uploaded'))
    }
    await getAllEquipments()
  }

  const deletePicture = async (id: string): Promise<void> => {
    try {
      await api.delete(`/api/v1/equipment/${id}/picture`)
    } catch (error) {
      console.error('Delete equipment picture error:', error)
      throw new Error(errorMessage(error, 'The picture could not be removed'))
    }
    await getAllEquipments()
  }

  // its activities are kept, without equipment
  const deleteEquipment = async (id: string): Promise<void> => {
    try {
      await api.delete(`/api/v1/equipment/${id}`)
    } catch (error) {
      console.error('Delete equipment error:', error)
      throw new Error(errorMessage(error, 'The equipment could not be deleted'))
    }
    equipments.value = equipments.value.filter(e => e.id !== id)
  }

  if (localStorage.getItem('msw-token')) {
    getAllEquipments().catch(() => {})
  }

  return {
    equipments,
    getAllEquipments,
    getEquipment,
    insertEquipment,
    updateEquipment,
    setDefault,
    assignToCommutes,
    uploadPicture,
    deletePicture,
    deleteEquipment,
  }
})
