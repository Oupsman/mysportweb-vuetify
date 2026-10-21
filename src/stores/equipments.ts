import { ref } from 'vue'
import type { Ref } from 'vue'
import { defineStore } from 'pinia'

import { api } from '@/api'
import type { Equipment } from '@/types/equipments'

export const useEquipmentsStore = defineStore('equipments', () => {
  const equipments: Ref<Equipment[]> = ref([])

  const getAllEquipments = async (): Promise<void> => {
    try {
      const response = await api.get('/api/v1/equipment/all')
      equipments.value = response.data ?? []
    } catch (error) {
      console.error('Get all equipments error:', error)
      throw new Error('get equipments failed')
    }
  }

  const insertEquipment = async (equipment: Equipment): Promise<Equipment> => {
    try {
      const response = await api.post('/api/v1/equipment', equipment)
      await getAllEquipments()
      return response.data
    } catch (error) {
      console.error('Create equipment error:', error)
      throw new Error('create equipment failed')
    }
  }

  if (localStorage.getItem('msw-token')) {
    getAllEquipments().catch(() => {})
  }

  return {
    equipments,
    getAllEquipments,
    insertEquipment,
  }
})
