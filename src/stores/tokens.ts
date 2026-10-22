import { ref } from 'vue'
import type { Ref } from 'vue'
import { defineStore } from 'pinia'
import { isAxiosError } from 'axios'

import { api } from '@/api'
import type { DeviceToken, NewDeviceToken } from '@/types/tokens'

// the message of the backend when there is one, it explains a refused token (expiry, too many tokens...)
const errorMessage = (error: unknown, fallback: string): string =>
  isAxiosError(error) && typeof error.response?.data?.error === 'string' ? error.response.data.error : fallback

export const useTokensStore = defineStore('tokens', () => {
  const tokens: Ref<DeviceToken[]> = ref([])

  const getTokens = async (): Promise<void> => {
    try {
      const response = await api.get('/api/v1/user/tokens')
      tokens.value = response.data.device_tokens ?? []
    } catch (error) {
      console.error('Get device tokens error:', error)
      throw new Error(errorMessage(error, 'The API tokens could not be loaded'))
    }
  }

  // returns the value of the token: the backend only gives it here, it can't be shown again
  const createToken = async (token: NewDeviceToken): Promise<string> => {
    try {
      const response = await api.post('/api/v1/user/tokens', token)
      tokens.value = [response.data.device_token, ...tokens.value]
      return response.data.token
    } catch (error) {
      console.error('Create device token error:', error)
      throw new Error(errorMessage(error, 'The API token could not be created'))
    }
  }

  const revokeToken = async (id: string): Promise<void> => {
    try {
      await api.delete(`/api/v1/user/tokens/${id}`)
      tokens.value = tokens.value.filter(t => t.id !== id)
    } catch (error) {
      console.error('Revoke device token error:', error)
      throw new Error(errorMessage(error, 'The API token could not be revoked'))
    }
  }

  return { tokens, getTokens, createToken, revokeToken }
})
