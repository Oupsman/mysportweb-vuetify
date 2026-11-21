import { ref } from 'vue'
import type { Ref } from 'vue'
import { defineStore } from 'pinia'
import { api, errorMessage } from '@/api'

// a browser of the user receiving the notifications
export interface PushSubscriptionInfo {
  id: number
  name: string
  created_at: string
}

export const usePushStore = defineStore('push', () => {
  const publicKey = ref('')
  const subscriptions: Ref<PushSubscriptionInfo[]> = ref([])

  const load = async (): Promise<void> => {
    try {
      const response = await api.get('/api/v1/notifications/push')
      publicKey.value = response.data.public_key
      subscriptions.value = response.data.subscriptions ?? []
    } catch (error) {
      throw new Error(errorMessage(error, 'The notification settings could not be loaded'))
    }
  }

  // records the subscription of this browser, returns its id
  const save = async (subscription: PushSubscription, name: string): Promise<number> => {
    try {
      const response = await api.post('/api/v1/notifications/push', { subscription: subscription.toJSON(), name })
      await load()
      return response.data.subscription.id
    } catch (error) {
      throw new Error(errorMessage(error, 'This browser could not be subscribed'))
    }
  }

  const remove = async (id: number): Promise<void> => {
    try {
      await api.delete(`/api/v1/notifications/push/${id}`)
      await load()
    } catch (error) {
      throw new Error(errorMessage(error, 'The subscription could not be removed'))
    }
  }

  const test = async (): Promise<void> => {
    try {
      await api.post('/api/v1/notifications/push/test')
    } catch (error) {
      throw new Error(errorMessage(error, 'The test notification could not be sent'))
    }
  }

  return { publicKey, subscriptions, load, save, remove, test }
})
