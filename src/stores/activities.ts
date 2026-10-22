import { ref } from 'vue'
import type { Ref } from 'vue'
import { defineStore } from 'pinia'

import { api } from '@/api'
import type {
  Activity,
  ActivitySearch,
  ActivitySummary,
  ActivityUpdate,
  DuplicateGroup,
  Route,
  SimilarActivity,
} from '@/types/activities'

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

  // a page of activities matching the filters, see the backend SearchActivities for the parameters;
  // repeated parameters (sport) are sent as sport=a&sport=b
  const searchActivities = async (params: Record<string, string | string[]>): Promise<ActivitySearch> => {
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      for (const v of Array.isArray(value) ? value : [value]) {
        query.append(key, v)
      }
    }
    try {
      const response = await api.get(`/api/v1/activity/search?${query}`)
      return response.data
    } catch (error) {
      console.error('Search activities error:', error)
      throw new Error('search activities failed')
    }
  }

  // the route of an activity and its other activities, only available to the owner
  const getSimilarActivities = async (id: string): Promise<{ route: Route | null, activities: SimilarActivity[] }> => {
    try {
      const response = await api.get(`/api/v1/activity/${id}/similar`)
      return { route: response.data.route ?? null, activities: response.data.activities ?? [] }
    } catch (error) {
      console.error('Get similar activities error:', error)
      throw new Error('get similar activities failed')
    }
  }

  // marks all the activities of a route, and the ones imported later, as commutes or not;
  // returns the number of activities updated
  const setRouteCommute = async (routeID: string, isCommute: boolean): Promise<number> => {
    try {
      const response = await api.post(`/api/v1/route/${routeID}/commute`, { is_commute: isCommute })
      return response.data.updated
    } catch (error) {
      console.error('Set route commute error:', error)
      throw new Error('set route commute failed')
    }
  }

  // the user's groups of duplicate activities, most recent first
  const findDuplicates = async (): Promise<DuplicateGroup[]> => {
    try {
      const response = await api.get('/api/v1/activity/duplicates')
      return response.data.groups ?? []
    } catch (error) {
      console.error('Find duplicates error:', error)
      throw new Error('find duplicates failed')
    }
  }

  // returns false when the user cancels the deletion; ask is false when the caller already asked
  const deleteActivity = async (id: string, ask = true): Promise<boolean> => {
    if (ask && !confirm('Are you sure you want to delete this activity?')) {
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
    searchActivities,
    getSimilarActivities,
    setRouteCommute,
    findDuplicates,
    deleteActivity,
    saveActivity,
  }
})
