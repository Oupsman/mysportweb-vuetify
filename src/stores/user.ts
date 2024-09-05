import { computed, ref } from 'vue'
import type { Ref } from 'vue'
import { defineStore } from 'pinia'
import router from '@/router'
import axios from 'axios'

import type { UserSession } from '@/types/user'

function parseJwt (token) {
  const base64Url = token.split('.')[1]
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
  }).join(''))

  return JSON.parse(jsonPayload)
}

export const useUserStore = defineStore('user', () => {
  const session: Ref<UserSession | null> = ref(null)

  const login = async (username: string, password:string, callback?: Function): Promise<void> => {
    axios.post(import.meta.env.VITE_BACKEND_URL + '/api/v1/user/login', {
      username,
      password,
    }).then(response => {
      if (response.data.token) {
        localStorage.setItem('msw-token', response.data.token)
        const data = parseJwt(response.data.token)
        setUserSession({
          ...data,
          token: response.data.token,
        })
        router.push('/')
      }
    }).catch(error => {
      console.error('Login error:', error)
      throw new Error('Login failed')
    })
  }

  const logout = async (callback?: Function): Promise<void> => {
    axios.post(import.meta.env.VITE_BACKEND_URL + '/api/v1/user/logout', {
      token,
    }).then(response => {
      if (response.data.token) {
        localStorage.removeItem('msw-token')
        session.value = null
        router.push('/')
      }
    }).catch(error => {
      console.error('Login error:', error)
      throw new Error('Login failed')
    })
  }
  const signup = async (username: string, password: string, email: string): Promise<void> => {
    const request = axios.create(
      {
        baseUrl: import.meta.env.VITE_BACKEND_URL,
        timeout: 1000,
        withCredentials: false,
      }
    )
    request.post(import.meta.env.VITE_BACKEND_URL + '/api/v1/user/register', {
      username,
      password,
      email,
    }).then(response => {
      console.log('Signup response:', response)
    }).catch(error => {
      console.error('Signup error:', error)
      throw new Error('Signup failed')
    })
  }

  const setUserSession = (data: UserSession | any): void => {
    session.value = data
  }

  const userIsLoggedIn = computed(() => {
    if (session.value?.exp) {
      const expiresAt = new Date(0).setUTCSeconds(session.value.exp)
      const now = new Date().getSeconds()
      return now < expiresAt
    }
    return false
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

  const dashboard = ref({})

  const refreshDashboard = async (): Promise<void> => {
    console.log('Get dashboard - function')
    const token = localStorage.getItem('msw-token')
    if (!token) {
      throw new Error('No token')
    }
    const request = axios.create({
      baseUrl: import.meta.env.VITE_BACKEND_URL,
      timeout: 1000,
      headers: { Authorization: `Bearer ${token}` },
    })
    request.get(import.meta.env.VITE_BACKEND_URL + '/api/v1/user/dashboard').then(response => {
      dashboard.value = response.data
      console.log('Dashboard:', response.data)
    }).catch(error => {
      console.error('Get dashboard error:', error)
      throw new Error('get dashboard failed')
    })
  }
  refreshDashboard()
  return { session, userIsLoggedIn, login, logout, setUserSession, checkToken, signup, dashboard, refreshDashboard }
})
