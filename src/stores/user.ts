import { computed, ref } from 'vue'
import type { Ref } from 'vue'
import { defineStore } from 'pinia'
import router from '@/router'
import { isAxiosError } from 'axios'
import { api, errorMessage, setSessionEndedHandler } from '@/api'
import { safeRedirect } from '@/auth'

import type { InstanceInfo, SignupGrant, UserSession } from '@/types/user'
import type { CalendarActivity, Dashboard } from '@/types/dashboard'

export const useUserStore = defineStore('user', () => {
  const session: Ref<UserSession | null> = ref(null)

  // redirect: the page asked before being sent to the login page
  // opens the session the backend answered: it set the cookie, and describes the session
  const startSession = async (data: { session: UserSession }, redirect?: unknown): Promise<void> => {
    setUserSession(data.session)
    sessionChecked = true
    await refreshDashboard()
    router.push(safeRedirect(redirect))
  }

  // the first step of a login: with the two-factor authentication, it answers the challenge of the second
  // one (loginSecondFactor), else the session is open
  const login = async (username: string, password: string, redirect?: unknown): Promise<string | null> => {
    let data
    try {
      data = (await api.post('/api/v1/user/login', { username, password })).data
    } catch (error) {
      console.error('Login error:', error)
      throw new Error(errorMessage(error, 'Wrong username or password'))
    }
    if (data.two_factor_required) {
      return data.challenge
    }
    if (data.session) {
      await startSession(data, redirect)
    }
    return null
  }

  // the second step: a code of the authenticator app, or a recovery code
  const loginSecondFactor = async (challenge: string, code: string, redirect?: unknown): Promise<void> => {
    let data
    try {
      data = (await api.post('/api/v1/user/login/2fa', { challenge, code })).data
    } catch (error) {
      console.error('Login error:', error)
      throw new Error(errorMessage(error, 'Wrong code'))
    }
    await startSession(data, redirect)
  }

  // the backend revokes the session, a copy of its token stops working too, and clears the cookie; the
  // session is forgotten here even when the backend can't be reached
  const logout = async (): Promise<void> => {
    try {
      await api.post('/api/v1/user/logout')
    } catch (error) {
      console.error('Logout error:', error)
    }
    session.value = null
    router.push('/')
  }

  // grant: the invitation or the setup code, when the registrations need one
  const signup = async (username: string, password: string, email: string, grant: SignupGrant = {}): Promise<void> => {
    try {
      await api.post('/api/v1/user/register', { username, password, email, ...grant })
    } catch (error) {
      console.error('Signup error:', error)
      throw new Error(errorMessage(error, 'Sign up failed'))
    }
    // the setup is done: the instance has its admin
    if (grant.setup_code && instance.value) {
      instance.value = { ...instance.value, setup_required: false }
    }
  }

  // how to register on this instance, asked once per page load
  const instance: Ref<InstanceInfo | null> = ref(null)
  const loadInstance = async (): Promise<InstanceInfo> => {
    if (!instance.value) {
      try {
        const response = await api.get('/api/v1/instance')
        instance.value = response.data
      } catch (error) {
        console.error('Get instance error:', error)
        throw new Error(errorMessage(error, 'The server could not be reached'))
      }
    }
    return instance.value!
  }
  // the sign up page is worth showing: registrations not closed, or the admin to create
  const canSignUp = computed(() =>
    instance.value === null || instance.value.registration !== 'closed' || instance.value.setup_required)

  const setUserSession = (data: UserSession | null): void => {
    session.value = data
  }

  const userIsLoggedIn = computed(() => {
    // exp is in seconds since epoch
    return session.value?.exp !== undefined && Date.now() / 1000 < session.value.exp
  })
  // the admin pages: the backend checks the role at each request, this only shows them
  const isAdmin = computed(() => userIsLoggedIn.value && session.value?.role === 'Admin')
  // the session is asked to the backend once per page load (the cookie can't be read here), then known
  let sessionChecked = false
  // whether there is a valid session, asking the backend the first time (called on each navigation)
  const restoreSession = async (): Promise<boolean> => {
    if (!sessionChecked) {
      try {
        const response = await api.get('/api/v1/user/session')
        session.value = response.data.session ?? null
        sessionChecked = true
      } catch (error) {
        session.value = null
        // 401: no session. The backend unreachable: asked again at the next navigation.
        if (isAxiosError(error) && error.response?.status === 401) {
          sessionChecked = true
        }
      }
    }
    if (session.value && Date.now() / 1000 >= session.value.exp) {
      session.value = null
    }
    return session.value !== null
  }

  // the backend refused the session of a request: the login page, back here after
  setSessionEndedHandler(() => {
    if (session.value === null) {
      // anonymous already (a public activity): nothing ended
      return
    }
    session.value = null
    const current = router.currentRoute.value.fullPath
    router.push({ path: '/login', query: current === '/' ? {} : { redirect: current } })
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

  // answers the address the user changes to, confirmed from its mailbox before it is used ('' without)
  const updateUser = async (user: object): Promise<string> => {
    try {
      const response = await api.post('/api/v1/user', user)
      // a new password ends the sessions, this one included: the backend sets the cookie of the new one
      if (response.data?.session) {
        setUserSession(response.data.session)
      }
      return response.data?.email_pending ?? ''
    } catch (error) {
      console.error('Update user error:', error)
      throw new Error(errorMessage(error, 'The profile could not be saved'))
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
    commutes: {
      this_year: { activities: 0, distance: 0, co2: 0 },
      all_time: { activities: 0, distance: 0, co2: 0 },
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

  return { session, userIsLoggedIn, isAdmin, login, loginSecondFactor, logout, setUserSession, restoreSession, signup, instance, loadInstance, canSignUp, dashboard, refreshDashboard, getCalendar, user, getUser, updateUser }
})
