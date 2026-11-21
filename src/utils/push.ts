// Web push in this browser: the service worker (public/sw.js) shows what the backend sends to the
// subscription recorded by the backend. Needs HTTPS (or localhost).

// what this browser can do, or why not
export type PushSupport = 'supported' | 'insecure' | 'unsupported'

export const pushSupport = (): PushSupport => {
  if (!window.isSecureContext) {
    return 'insecure'
  }
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window ? 'supported' : 'unsupported'
}

const registration = (): Promise<ServiceWorkerRegistration> =>
  navigator.serviceWorker.register('/sw.js', { scope: '/' })

// the public key of the backend (base64 URL) as the bytes the PushManager wants
const keyBytes = (base64: string): Uint8Array => {
  const padded = (base64 + '='.repeat((4 - base64.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0))
}

// the subscription of this browser, null without
export const currentSubscription = async (): Promise<PushSubscription | null> => {
  const existing = await navigator.serviceWorker.getRegistration('/')
  return existing ? existing.pushManager.getSubscription() : null
}

// asks the permission, then subscribes this browser with the public key of the backend; the permission
// refused throws
export const subscribe = async (publicKey: string): Promise<PushSubscription> => {
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error(permission === 'denied'
      ? 'Notifications are blocked for this site: allow them in the settings of the browser'
      : 'Notifications were not allowed')
  }
  const reg = await registration()
  await navigator.serviceWorker.ready
  const existing = await reg.pushManager.getSubscription()
  if (existing) {
    return existing
  }
  return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) })
}

// a name telling the browsers of the user apart: "Firefox on Linux"
export const browserName = (): string => {
  const ua = navigator.userAgent
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : (/Firefox\//.test(ua) ? 'Firefox' : (/Chrome\//.test(ua) ? 'Chrome' : (/Safari\//.test(ua) ? 'Safari' : 'Browser')))
  const os = /Android/.test(ua)
    ? 'Android'
    : (/iPhone|iPad/.test(ua) ? 'iOS' : (/Mac OS X/.test(ua) ? 'macOS' : (/Windows/.test(ua) ? 'Windows' : (/Linux/.test(ua) ? 'Linux' : ''))))
  return os ? `${browser} on ${os}` : browser
}
