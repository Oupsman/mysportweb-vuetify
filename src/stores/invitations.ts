import { ref } from 'vue'
import type { Ref } from 'vue'
import { defineStore } from 'pinia'

import { api, errorMessage } from '@/api'
import type { Invitation, NewInvitation } from '@/types/user'

// the invitations of the instance, for its admins
export const useInvitationsStore = defineStore('invitations', () => {
  const invitations: Ref<Invitation[]> = ref([])

  const getInvitations = async (): Promise<void> => {
    try {
      const response = await api.get('/api/v1/admin/invitations')
      invitations.value = response.data.invitations ?? []
    } catch (error) {
      console.error('Get invitations error:', error)
      throw new Error(errorMessage(error, 'The invitations could not be loaded'))
    }
  }

  // email: the only one it registers, '' for any; the code is only given here, it can't be shown again
  // send: emailed to its address, the emails on
  const createInvitation = async (email: string, days: number, send = false): Promise<NewInvitation> => {
    try {
      const response = await api.post('/api/v1/admin/invitations', { email, days, send })
      invitations.value = [response.data.invitation, ...invitations.value]
      return response.data
    } catch (error) {
      console.error('Create invitation error:', error)
      throw new Error(errorMessage(error, 'The invitation could not be created'))
    }
  }

  const revokeInvitation = async (id: string): Promise<void> => {
    try {
      await api.delete(`/api/v1/admin/invitations/${id}`)
      invitations.value = invitations.value.filter(i => i.id !== id)
    } catch (error) {
      console.error('Revoke invitation error:', error)
      throw new Error(errorMessage(error, 'The invitation could not be revoked'))
    }
  }

  return { invitations, getInvitations, createInvitation, revokeInvitation }
})
