import axios, { isAxiosError } from 'axios'

// Shared client for the backend API: sends the token when there is one
export const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  // activities carry every record of the FIT file, they can be big
  timeout: 30000,
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('msw-token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// the message of the backend when there is one, it explains a refused request, else fallback
export const errorMessage = (error: unknown, fallback: string): string =>
  isAxiosError(error) && typeof error.response?.data?.error === 'string' ? error.response.data.error : fallback

// the URL of a file the backend serves under /MEDIA, from the path it returns
export const mediaUrl = (path: string): string => `${import.meta.env.VITE_BACKEND_URL}${path}`
