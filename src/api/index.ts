import axios from 'axios'

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
