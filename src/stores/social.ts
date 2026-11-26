import { ref } from 'vue'
import type { Ref } from 'vue'
import { defineStore } from 'pinia'

import { api, errorMessage } from '@/api'
import type { ActivitySocial } from '@/types/social'

// the cheers and comments of the activity shown, shared by its cheer button and its comments; and whether the
// user is notified of those on their activities
export const useSocialStore = defineStore('social', () => {
  const activityId = ref('')
  const social: Ref<ActivitySocial | null> = ref(null)

  // every change answers the cheers and comments as they are now
  const call = async (id: string, request: () => Promise<{ data: ActivitySocial }>, failure: string): Promise<void> => {
    try {
      const data = (await request()).data
      if (activityId.value === id) {
        social.value = data
      }
    } catch (error) {
      console.error(failure, error)
      throw new Error(errorMessage(error, failure))
    }
  }

  const load = (id: string): Promise<void> => {
    if (activityId.value !== id) {
      activityId.value = id
      social.value = null
    }
    return call(id, () => api.get(`/api/v1/activity/${id}/social`), 'The cheers and comments could not be loaded')
  }

  const cheer = (on: boolean): Promise<void> => {
    const id = activityId.value
    const path = `/api/v1/activity/${id}/cheer`
    return call(id, () => (on ? api.put(path) : api.delete(path)), 'The cheer could not be changed')
  }

  const comment = (body: string): Promise<void> => {
    const id = activityId.value
    return call(id, () => api.post(`/api/v1/activity/${id}/comments`, { body }), 'The comment could not be posted')
  }

  const editComment = (commentId: string, body: string): Promise<void> => {
    const id = activityId.value
    return call(id, () => api.post(`/api/v1/activity/${id}/comments/${commentId}`, { body }),
      'The comment could not be changed')
  }

  const deleteComment = (commentId: string): Promise<void> => {
    const id = activityId.value
    return call(id, () => api.delete(`/api/v1/activity/${id}/comments/${commentId}`), 'The comment could not be deleted')
  }

  const getNotify = async (): Promise<boolean> => {
    try {
      return (await api.get('/api/v1/notifications/social')).data.enabled
    } catch (error) {
      console.error('Get social notifications error:', error)
      throw new Error(errorMessage(error, 'The notifications of the cheers and comments could not be loaded'))
    }
  }

  const setNotify = async (enabled: boolean): Promise<void> => {
    try {
      await api.post('/api/v1/notifications/social', { enabled })
    } catch (error) {
      console.error('Set social notifications error:', error)
      throw new Error(errorMessage(error, 'The notifications of the cheers and comments could not be changed'))
    }
  }

  return { activityId, social, load, cheer, comment, editComment, deleteComment, getNotify, setNotify }
})
