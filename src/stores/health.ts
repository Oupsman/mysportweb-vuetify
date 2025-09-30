import { ref } from 'vue'
import type { Ref } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'

import type { HealthDatas } from '@/types/health'

export const useHealthStore = defineStore('equipments', () => {
  const healthDatas: Ref<HealthDatas[]> = ref([])
  const getAllHealthDatas = async (): Promise<boolean | undefined> => {
    const token = localStorage.getItem('msw-token')
    if (!token) {
      throw new Error('No token')
    }
    const request = axios.create({
      baseURL: import.meta.env.VITE_BACKEND_URL,
      timeout: 1000,
      headers: { Authorization: `Bearer ${token}` },
    })
    request.get(import.meta.env.VITE_BACKEND_URL + '/api/v1/health/all').then(response => {
      healthDatas.value = response.data
      return true
    }).catch(error => {
      throw new Error('get healthdatas failed')
    })
    return true
  }
  console.log('Get all health datas - store')
  getAllHealthDatas()
  const insertHealthData = async (healthData: HealthDatas): Promise<void> => {
    const token = localStorage.getItem('msw-token')
    if (!token) {
      throw new Error('No token')
    }
    const request = axios.create({
      baseURL: import.meta.env.VITE_BACKEND_URL,
      timeout: 1000,
      headers: { Authorization: `Bearer ${token}` },
    })
    request.post(import.meta.env.VITE_BACKEND_URL + '/api/v1/health', {
      ...healthData,
      token,
    }).then(response => {
      console.log('Healthdata created:', response.data)
    }).catch(error => {
      console.error('Create Healthdata error:', error)
      throw new Error('Create HealthdataA' +
        ' failed')
    })
  }

  return {
    healthDatas,
    getAllHealthDatas: getAllHealthDatas,
    insertHealthData: insertHealthData,
  }

})
