import { ref } from 'vue'
import type { Ref } from 'vue'
import { defineStore } from 'pinia'

import { api } from '@/api'
import type { HealthDatas } from '@/types/health'

export const useHealthStore = defineStore('health', () => {
  const healthDatas: Ref<HealthDatas[]> = ref([])

  const getAllHealthDatas = async (): Promise<void> => {
    try {
      const response = await api.get('/api/v1/healthdatas')
      healthDatas.value = response.data ?? []
    } catch (error) {
      console.error('Get health datas error:', error)
      throw new Error('get health datas failed')
    }
  }

  const insertHealthData = async (healthData: HealthDatas): Promise<void> => {
    try {
      await api.post('/api/v1/healthdatas', healthData)
      await getAllHealthDatas()
    } catch (error) {
      console.error('Create health data error:', error)
      throw new Error('create health data failed')
    }
  }

  if (localStorage.getItem('msw-token')) {
    getAllHealthDatas().catch(() => {})
  }

  return {
    healthDatas,
    getAllHealthDatas,
    insertHealthData,
  }
})
