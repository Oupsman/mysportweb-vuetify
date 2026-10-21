import { ref } from 'vue'
import type { Ref } from 'vue'
import { defineStore } from 'pinia'

import { api } from '@/api'
import type { Activity, ActivitySummary, ActivityUpdate, SimilarActivity } from '@/types/activities'

export const useActivitiesStore = defineStore('activities', () => {
  const activity: Ref<Activity | undefined> = ref()
  const activities: Ref<ActivitySummary[]> = ref([])

  const getActivity = async (id: string): Promise<Activity> => {
    try {
      const response = await api.get(`/api/v1/activity/${id}`)
      return response.data.activity
    } catch (error) {
      console.error('Get activity error:', error)
      throw new Error('get activity failed')
    }
  }

  const getActivities = async (pointer: number, count: number): Promise<ActivitySummary[]> => {
    try {
      const response = await api.get(`/api/v1/activity/list/${pointer}/${count}`)
      return response.data.activities ?? []
    } catch (error) {
      console.error('Get activities error:', error)
      throw new Error('get activities failed')
    }
  }

  // the other activities on the same route, only available to the owner
  const getSimilarActivities = async (id: string): Promise<SimilarActivity[]> => {
    try {
      const response = await api.get(`/api/v1/activity/${id}/similar`)
      return response.data.activities ?? []
    } catch (error) {
      console.error('Get similar activities error:', error)
      throw new Error('get similar activities failed')
    }
  }

  // returns false when the user cancels the deletion
  const deleteActivity = async (id: string): Promise<boolean> => {
    if (!confirm('Are you sure you want to delete this activity?')) {
      return false
    }
    try {
      await api.delete(`/api/v1/activity/${id}`)
      activities.value = activities.value.filter(a => a.id !== id)
      return true
    } catch (error) {
      console.error('Delete activity error:', error)
      throw new Error('delete activity failed')
    }
  }

  // only sends the editable fields, the whole activity weights megabytes
  const saveActivity = async (update: ActivityUpdate): Promise<void> => {
    try {
      await api.post(`/api/v1/activity/${update.id}`, {
        title: update.title,
        can_comments: update.can_comments,
        visibility: update.visibility,
        is_commute: update.is_commute,
        equipment_id: update.equipment_id,
      })
    } catch (error) {
      console.error('Update activity error:', error)
      throw new Error('update activity failed')
    }
  }

  return {
    activity,
    activities,
    getActivity,
    getActivities,
    getSimilarActivities,
    deleteActivity,
    saveActivity,
  }
})
