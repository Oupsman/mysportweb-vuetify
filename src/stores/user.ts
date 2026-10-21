import { computed, ref } from 'vue'
import type { Ref } from 'vue'
import { defineStore } from 'pinia'
import router from '@/router'
import { api } from '@/api'

import type { UserSession } from '@/types/user'
import type { Dashboard } from '@/types/dashboard'

function parseJwt (token: string) {
  const base64Url = token.split('.')[1]
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
  }).join(''))

  return JSON.parse(jsonPayload)
}

export const useUserStore = defineStore('user', () => {
  const session: Ref<UserSession | null> = ref(null)

  const login = async (username: string, password: string): Promise<void> => {
    try {
      const response = await api.post('/api/v1/user/login', { username, password })
      if (response.data.token) {
        localStorage.setItem('msw-token', response.data.token)
        setUserSession({
          ...parseJwt(response.data.token),
          token: response.data.token,
        })
        await refreshDashboard()
        router.push('/')
      }
    } catch (error) {
      console.error('Login error:', error)
      throw new Error('Login failed')
    }
  }

  // tokens are stateless JWTs: logging out is forgetting the token
  const logout = (): void => {
    localStorage.removeItem('msw-token')
    session.value = null
    router.push('/')
  }

  const signup = async (username: string, password: string, email: string): Promise<void> => {
    try {
      await api.post('/api/v1/user/register', { username, password, email })
    } catch (error) {
      console.error('Signup error:', error)
      throw new Error('Signup failed')
    }
  }

  const setUserSession = (data: UserSession | any): void => {
    session.value = data
  }

  const userIsLoggedIn = computed(() => {
    // exp is in seconds since epoch
    return session.value?.exp !== undefined && Date.now() / 1000 < session.value.exp
  })
  // checks if the JWT token is still valid
  const checkToken = computed((): boolean => {
    const token = localStorage.getItem('msw-token')
    if (token) {
      const decoded = parseJwt(token)
      if (decoded.exp < Date.now() / 1000) {
        // Token is expired
        localStorage.removeItem('msw-token')
        session.value = null
        return false
      } else {
        session.value = decoded
      }
    }
    return true
  })

  const user = ref({})

  const getUser = async (): Promise<Object> => {
    try {
      const response = await api.get('/api/v1/user')
      user.value = response.data
      return response.data
    } catch (error) {
      console.error('Get user error:', error)
      throw new Error('get user failed')
    }
  }

  const updateUser = async (user: Object): Promise<void> => {
    try {
      await api.post('/api/v1/user', user)
    } catch (error) {
      console.error('Update user error:', error)
      throw new Error('update user failed')
    }
  }

  const dashboard: Ref<Dashboard> = ref({
    activities: [],
    total_distance: 0,
    total_duration: '',
    nb_equipments: 0,
    nb_activities: 0,
    activities_calendar: [],
    max_distance: 0,
    max_duration: 0,
    max_elevation: 0,
  })

  const refreshDashboard = async (): Promise<void> => {
    try {
      const response = await api.get('/api/v1/user/dashboard')
      dashboard.value = response.data
    } catch (error) {
      console.error('Get dashboard error:', error)
      throw new Error('get dashboard failed')
    }
  }
  if (localStorage.getItem('msw-token')) {
    refreshDashboard().catch(() => {})
  }
  return { session, userIsLoggedIn, login, logout, setUserSession, checkToken, signup, dashboard, refreshDashboard, user, getUser, updateUser }
})
