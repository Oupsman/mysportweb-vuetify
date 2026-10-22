import type { UserSession } from '@/types/user'

export const tokenKey = 'msw-token'

export function parseJwt (token: string) {
  const base64Url = token.split('.')[1]
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
  }).join(''))

  return JSON.parse(jsonPayload)
}

// the session of the stored token, null without token or when it is expired or unreadable (then removed)
export function storedSession (): UserSession | null {
  const token = localStorage.getItem(tokenKey)
  if (!token) {
    return null
  }
  try {
    const claims = parseJwt(token)
    if (typeof claims.exp === 'number' && claims.exp > Date.now() / 1000) {
      return { ...claims, token }
    }
  } catch {
    // unreadable token, forget it
  }
  localStorage.removeItem(tokenKey)
  return null
}

// where to go after login: only paths of this app, never another site ("//host" or "https://...")
export function safeRedirect (target: unknown): string {
  return typeof target === 'string' && target.startsWith('/') && !target.startsWith('//') ? target : '/'
}
