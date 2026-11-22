import axios, { isAxiosError } from 'axios'

// Shared client for the backend API. The session is the HttpOnly cookie the backend sets at login, sent by
// the browser: withCredentials for the development server, whose API is on another port.
export const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  // activities carry every record of the FIT file, they can be big
  timeout: 30000,
  withCredentials: true,
})

// what to do when the backend refuses the session (expired, logged out elsewhere, password changed),
// set by the user store
let onSessionEnded: (() => void) | null = null
export const setSessionEndedHandler = (handler: () => void): void => {
  onSessionEnded = handler
}

// the requests answering 401 without meaning the session ended: a failed login, the session check
const sessionRoutes = new Set(['/api/v1/user/login', '/api/v1/user/session', '/api/v1/user/logout'])

api.interceptors.response.use(undefined, error => {
  if (isAxiosError(error) && error.response?.status === 401 && !sessionRoutes.has(error.config?.url ?? '')) {
    onSessionEnded?.()
  }
  return Promise.reject(error)
})

// the message of the backend when there is one, it explains a refused request, else fallback
export const errorMessage = (error: unknown, fallback: string): string => {
  if (!isAxiosError(error)) return fallback
  const data = error.response?.data
  // the handlers answer {error}, the authentication {message}
  if (typeof data?.error === 'string') return data.error
  return typeof data?.message === 'string' ? data.message.replace(/^(forbidden|unauthorized): /, '') : fallback
}

// the code of a refused request: mfa_required, totp_required, totp_invalid...
export const errorCode = (error: unknown): string =>
  isAxiosError(error) && typeof error.response?.data?.code === 'string' ? error.response.data.code : ''

// the URL of a file the backend serves under /MEDIA, from the path it returns
export const mediaUrl = (path: string): string => `${import.meta.env.VITE_BACKEND_URL}${path}`
