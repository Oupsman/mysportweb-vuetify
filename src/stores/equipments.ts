import { ref } from 'vue'
import type { Ref } from 'vue'
import { defineStore } from 'pinia'

import { useUserStore } from '@/stores/user'
const userStore = useUserStore()

export const useEquipmentsStore = defineStore('equipments', () => {
  const equipments: Ref<Equipment[]> = ref([])
  const getAllEquipments = async (): Promise<Equipment[] | undefined> => {
    const userStore = useUserStore()
    const token = userStore.session.value?.token
    if (!token) {
      throw new Error('No token')
    }
    const request = axios.create({
      baseUrl: import.meta.env.VITE_BACKEND_URL,
      timeout: 1000,
      headers: { Authorization: `Bearer ${userStore.session.value.token}` },
    })
    request.get(import.meta.env.VITE_BACKEND_URL + '/api/v1/equipment/all', {
      ...equipment,
      token,
    }).then(response => {
      console.log('Equipments:', response.data)
      equipments.value = response.data
    }).catch(error => {
      console.error('Get all equipments error:', error)
      throw new Error('get equipments failed')
    })
  }
  getAllEquipments()
  const insertEquipment = async (equipment: Equipment): Promise<void> => {
    const userStore = useUserStore()
    const token = userStore.session.value?.token
    if (!token) {
      throw new Error('No token')
    }
    const request = axios.create({
      baseUrl: import.meta.env.VITE_BACKEND_URL,
      timeout: 1000,
      headers: { Authorization: `Bearer ${userStore.session.value.token}` },
    })
    request.post(import.meta.env.VITE_BACKEND_URL + '/api/v1/equipment', {
      ...equipment,
      token,
    }).then(response => {
      console.log('Equipment created:', response.data)
    }).catch(error => {
      console.error('Create equipment error:', error)
      throw new Error('Create equipment failed')
    })
  }
})
