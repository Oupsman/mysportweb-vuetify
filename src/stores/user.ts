import { computed, ref } from 'vue'
import type { Ref } from 'vue'
import { defineStore } from 'pinia'
import router from '@/router'
import { api } from '@/api'
import { parseJwt, safeRedirect, storedSession } from '@/auth'

import type { UserSession } from '@/types/user'
import type { CalendarActivity, Dashboard } from '@/types/dashboard'

export const useUserStore = defineStore('user', () => {
  const session: Ref<UserSession | null> = ref(null)

  // redirect: the page asked before being sent to the login page
  const login = async (username: string, password: string, redirect?: unknown): Promise<void> => {
    try {
      const response = await api.post('/api/v1/user/login', { username, password })
      if (response.data.token) {
        localStorage.setItem('msw-token', response.data.token)
        setUserSession({
          ...parseJwt(response.data.token),
          token: response.data.token,
        })
        await refreshDashboard()
        router.push(safeRedirect(redirect))
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
  // restores the session from the stored token, false when there is no valid one (called on each navigation)
  const restoreSession = (): boolean => {
    session.value = storedSession()
    return session.value !== null
  }

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

  const emptyTotals = () => ({ activities: 0, distance: 0, duration: 0, elevation: 0 })
  const dashboard: Ref<Dashboard> = ref({
    totals: {
      this_week: emptyTotals(),
      last_week: emptyTotals(),
      this_month: emptyTotals(),
      last_month: emptyTotals(),
      this_year: emptyTotals(),
      all_time: emptyTotals(),
    },
    week_starts: [],
    weekly: [],
    sports: [],
    recent: [],
    calendar: [],
    nb_equipments: 0,
    timezone: '',
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
  // activities of a month (YYYY-MM), in the user's timezone
  const getCalendar = async (month: string): Promise<CalendarActivity[]> => {
    try {
      const response = await api.get('/api/v1/user/calendar', { params: { month } })
      return response.data.activities ?? []
    } catch (error) {
      console.error('Get calendar error:', error)
      throw new Error('get calendar failed')
    }
  }

  if (localStorage.getItem('msw-token')) {
    refreshDashboard().catch(() => {})
  }
  return { session, userIsLoggedIn, login, logout, setUserSession, restoreSession, signup, dashboard, refreshDashboard, getCalendar, user, getUser, updateUser }
})
