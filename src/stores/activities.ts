import { computed, ref } from 'vue'
import type { Ref } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'

export const useActivitiesStore = defineStore('activities', () => {
  const activity: Ref<Object | undefined> = ref({})
  const activities = ref([])

  const getActivity = async (id: string): Promise<Object | undefined> => {
    console.log('Get activity - function')
    const token = localStorage.getItem('msw-token')
    if (!token) {
      throw new Error('No token')
    }
    const request = axios.create({
      baseUrl: import.meta.env.VITE_BACKEND_URL,
      timeout: 1000,
      headers: { Authorization: `Bearer ${token}` },
    })
    request.get(import.meta.env.VITE_BACKEND_URL + '/api/v1/activity/' + id).then(response => {
      console.log('Activity:', response.data)
      activity.value = response.data.activity
    }).catch(error => {
      console.error('Get activity error:', error)
      throw new Error('get activity failed')
    })
  }
  const getDate = computed(() => {
    const d = new Date(activity.value.date)
    return d.getDay() + '/' + d.getMonth() + '/' + d.getFullYear() + ' ' + d.getHours() + ':' + d.getMinutes()
  })

  const getActivities = async (): Promise<Object | undefined> => {
    console.log('Get activities - function')
    const token = localStorage.getItem('msw-token')
    if (!token) {
      throw new Error('No token')
    }
    const request = axios.create({
      baseUrl: import.meta.env.VITE_BACKEND_URL,
      timeout: 1000,
      headers: { Authorization: `Bearer ${token}` },
    })
    request.get(import.meta.env.VITE_BACKEND_URL + '/api/v1/activity/list').then(response => {
      activities.value = response.data.activities
    }).catch(error => {
      console.error('Get activities error:', error)
      throw new Error('get activities failed')
    })
  }
  getActivities()
  return {
    activity,
    activities,
    getDate,
    getActivity,
    getActivities,
  }
})
