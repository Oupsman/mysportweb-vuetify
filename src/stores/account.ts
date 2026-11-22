import { ref } from 'vue'
import type { Ref } from 'vue'
import { defineStore } from 'pinia'

import { api, errorMessage } from '@/api'
import type { AdminUser, TwoFactorSetup, TwoFactorStatus, UserSession } from '@/types/user'

// the code of the authenticator app the critical admin actions send, each time
const totpHeader = (code: string) => ({ headers: { 'X-TOTP-Code': code } })

// the account of the user (two-factor authentication, export, deletion) and the users of the admins
export const useAccountStore = defineStore('account', () => {
  const call = async <T>(request: () => Promise<{ data: T }>, failure: string): Promise<T> => {
    try {
      return (await request()).data
    } catch (error) {
      console.error(failure, error)
      throw new Error(errorMessage(error, failure))
    }
  }

  const twoFactor: Ref<TwoFactorStatus | null> = ref(null)
  const getTwoFactor = async (): Promise<void> => {
    twoFactor.value = await call(() => api.get('/api/v1/user/2fa'), 'The two-factor authentication could not be loaded')
  }
  const setupTwoFactor = (password: string): Promise<TwoFactorSetup> =>
    call(() => api.post('/api/v1/user/2fa/setup', { password }), 'The setup could not start')
  // answers the recovery codes, shown once; the session becomes a verified one
  const enableTwoFactor = (code: string): Promise<{ recovery_codes: string[], session: UserSession }> =>
    call(() => api.post('/api/v1/user/2fa/enable', { code }), 'Wrong code')
  const disableTwoFactor = (password: string, code: string): Promise<unknown> =>
    call(() => api.post('/api/v1/user/2fa/disable', { password, code }), 'The two-factor authentication could not be turned off')
  const newRecoveryCodes = (password: string, code: string): Promise<{ recovery_codes: string[] }> =>
    call(() => api.post('/api/v1/user/2fa/recovery', { password, code }), 'New recovery codes could not be created')

  // the export is a download of the browser: the session cookie goes with it
  const exportUrl = `${import.meta.env.VITE_BACKEND_URL}/api/v1/user/export`
  const deleteAccount = (password: string, username: string, code: string): Promise<unknown> =>
    call(() => api.post('/api/v1/user/delete', { password, username, code }), 'The account could not be deleted')

  const resetPassword = (code: string, password: string): Promise<{ username: string }> =>
    call(() => api.post('/api/v1/user/password-reset', { code, password }), 'The password could not be changed')

  const users: Ref<AdminUser[]> = ref([])
  const getUsers = async (): Promise<void> => {
    users.value = (await call<{ users: AdminUser[] }>(() => api.get('/api/v1/admin/users'), 'The users could not be loaded')).users
  }
  const setRole = (id: number, role: string, code: string) =>
    call(() => api.post(`/api/v1/admin/users/${id}/role`, { role }, totpHeader(code)), 'The role could not be changed')
  const setDisabled = (id: number, disabled: boolean, code: string) =>
    call(() => api.post(`/api/v1/admin/users/${id}/${disabled ? 'disable' : 'enable'}`, null, totpHeader(code)),
      disabled ? 'The account could not be disabled' : 'The account could not be enabled')
  const deleteUser = (id: number, code: string) =>
    call(() => api.delete(`/api/v1/admin/users/${id}`, totpHeader(code)), 'The account could not be deleted')
  const passwordResetLink = (id: number, code: string): Promise<{ link: string, expires_at: string }> =>
    call(() => api.post(`/api/v1/admin/users/${id}/password-reset`, null, totpHeader(code)), 'The link could not be created')

  return {
    twoFactor,
    getTwoFactor,
    setupTwoFactor,
    enableTwoFactor,
    disableTwoFactor,
    newRecoveryCodes,
    exportUrl,
    deleteAccount,
    resetPassword,
    users,
    getUsers,
    setRole,
    setDisabled,
    deleteUser,
    passwordResetLink,
  }
})
