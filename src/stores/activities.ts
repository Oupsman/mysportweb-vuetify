import { computed, ref } from 'vue'
import type { Ref } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'

export const useActivitiesStore = defineStore('activities', () => {
  const activity: Ref<Object | undefined> = ref({})
  const activities = ref([])

  const getActivity = async (id: string): Promise<Object> => {
    console.log('Get activity - function', id)
    const token = localStorage.getItem('msw-token')
    try {
      const request = axios.create({
        baseURL: import.meta.env.VITE_BACKEND_URL,
        timeout: 1000,
        headers: { Authorization: `Bearer ${token}` },
      })

      const response = await request.get(`/api/v1/activity/${id}`)
      console.log('Activity:', response.data.activity)
      return response.data.activity
    } catch (error) {
      console.error('Get activity error:', error)
      throw new Error('get activity failed')
    }
  }

  const getActivities = (): Object => {
    console.log('Get activities - function')
    const token = localStorage.getItem('msw-token')
    const request = axios.create({
      baseUrl: import.meta.env.VITE_BACKEND_URL,
      timeout: 1000,
      headers: { Authorization: `Bearer ${token}` },
    })
    request.get(import.meta.env.VITE_BACKEND_URL + '/api/v1/activity/list').then(response => {
      activities.value = response.data.activities
      return response.data.activities
    }).catch(error => {
      console.error('Get activities error:', error)
      throw new Error('get activities failed')
    })
  }

  const deleteActivity = async (id: string): Promise<Object | undefined> => {
    console.log('Delete activity - function')
    confirm('Are you sure you want to delete this activity?')
    const token = localStorage.getItem('msw-token')
    if (!token) {
      throw new Error('No token')
    }
    const request = axios.create({
      baseUrl: import.meta.env.VITE_BACKEND_URL,
      timeout: 1000,
      headers: { Authorization: `Bearer ${token}` },
    })
    request.delete(import.meta.env.VITE_BACKEND_URL + '/api/v1/activity/' + id).then(response => {
      console.log('Activity deleted:', response.data)
      getActivities()
    }).catch(error => {
      console.error('Delete activity error:', error)
      throw new Error('delete activity')
    })
  }

  const saveActivity = async (activity: Object):Promise<Object | undefined> => {
    console.log('Activity to save', activity)
    const token = localStorage.getItem('msw-token')
    if (!token) {
      throw new Error('No token')
    }
    const request = axios.create({
      baseUrl: import.meta.env.VITE_BACKEND_URL,
      timeout: 1000,
      headers: { Authorization: `Bearer ${token}` },
    })
    request.post(import.meta.env.VITE_BACKEND_URL + '/api/v1/activity/' + activity.ID, {
      ...activity,
    }).then(response => {
      console.log('Activity updated:', response.data)
      getActivities()
    }).catch(error => {
      console.error('Update activity error:', error)
      throw new Error('update activity')
    })
  }

  getActivities()
  return {
    activity,
    activities,
    getActivity,
    getActivities,
    deleteActivity,
    saveActivity,
  }
})
