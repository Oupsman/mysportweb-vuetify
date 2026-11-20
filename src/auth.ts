// The session is an HttpOnly cookie set by the backend: the scripts of the page never see the token. The
// page only knows whose session it is and until when (UserSession), from the backend.

// the key of the token kept by the versions before the cookie: removed at the start, it must not stay
// readable by any script
const legacyTokenKey = 'msw-token'

export function forgetLegacyToken (): void {
  try {
    localStorage.removeItem(legacyTokenKey)
  } catch {
    // storage unavailable: nothing kept there either
  }
}

// where to go after login: only paths of this app, never another site ("//host" or "https://...")
export function safeRedirect (target: unknown): string {
  return typeof target === 'string' && target.startsWith('/') && !target.startsWith('//') ? target : '/'
}
