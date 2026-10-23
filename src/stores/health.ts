import { ref } from 'vue'
import type { Ref } from 'vue'
import { defineStore } from 'pinia'

import { api, errorMessage } from '@/api'
import type { HealthData, HealthDataFields, WeightEstimate } from '@/types/health'

export const useHealthStore = defineStore('health', () => {
  // most recent first
  const healthDatas: Ref<HealthData[]> = ref([])

  const getAllHealthDatas = async (): Promise<void> => {
    try {
      const response = await api.get('/api/v1/healthdatas')
      healthDatas.value = response.data ?? []
    } catch (error) {
      console.error('Get health datas error:', error)
      throw new Error(errorMessage(error, 'The health data could not be loaded'))
    }
  }

  const insertHealthData = async (healthData: HealthDataFields): Promise<void> => {
    try {
      await api.post('/api/v1/healthdatas', healthData)
    } catch (error) {
      console.error('Create health data error:', error)
      throw new Error(errorMessage(error, 'The measure could not be saved'))
    }
    await getAllHealthDatas()
    await getWeightTarget().catch(() => {})
  }

  const updateHealthData = async (id: number, healthData: HealthDataFields): Promise<void> => {
    try {
      await api.post(`/api/v1/healthdatas/${id}`, healthData)
    } catch (error) {
      console.error('Update health data error:', error)
      throw new Error(errorMessage(error, 'The measure could not be saved'))
    }
    await getAllHealthDatas()
    await getWeightTarget().catch(() => {})
  }

  // the target weight and when it is reached; a new measure changes the estimate
  const weightTarget: Ref<WeightEstimate | null> = ref(null)

  const getWeightTarget = async (): Promise<void> => {
    try {
      weightTarget.value = (await api.get('/api/v1/healthdatas/target')).data
    } catch (error) {
      console.error('Get weight target error:', error)
      throw new Error(errorMessage(error, 'The target weight could not be loaded'))
    }
  }

  // 0 removes the target
  const setWeightTarget = async (target: number): Promise<void> => {
    try {
      weightTarget.value = (await api.post('/api/v1/healthdatas/target', { target })).data
    } catch (error) {
      console.error('Set weight target error:', error)
      throw new Error(errorMessage(error, 'The target weight could not be saved'))
    }
  }

  const deleteHealthData = async (id: number): Promise<void> => {
    try {
      await api.delete(`/api/v1/healthdatas/${id}`)
    } catch (error) {
      console.error('Delete health data error:', error)
      throw new Error(errorMessage(error, 'The measure could not be deleted'))
    }
    healthDatas.value = healthDatas.value.filter(d => d.id !== id)
    await getWeightTarget().catch(() => {})
  }

  return {
    healthDatas,
    getAllHealthDatas,
    insertHealthData,
    updateHealthData,
    deleteHealthData,
    weightTarget,
    getWeightTarget,
    setWeightTarget,
  }
})
