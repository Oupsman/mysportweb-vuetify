// The service worker of MySportWeb: it only shows the notifications the backend pushes (web push), and opens
// their page when clicked. No cache, no fetch handler: the app loads as without it.
// The payload: {"title", "body", "url"} (notifications.PushMessage of the backend).

self.addEventListener('push', event => {
  let message = { title: 'MySportWeb', body: '', url: '/' }
  try {
    message = { ...message, ...event.data.json() }
  } catch {
    // not JSON: shown as text
    if (event.data) {
      message.body = event.data.text()
    }
  }
  event.waitUntil(self.registration.showNotification(message.title, {
    body: message.body,
    icon: '/favicon.ico',
    data: { url: message.url },
  }))
})

// a click opens the page of the notification, in a window of the app when one is open
self.addEventListener('notificationclick', event => {
  event.notification.close()
  // only the pages of this app
  const path = typeof event.notification.data?.url === 'string' && event.notification.data.url.startsWith('/')
    ? event.notification.data.url
    : '/'
  const url = new URL(path, self.location.origin).href
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const client of windows) {
      if (new URL(client.url).origin === self.location.origin && 'focus' in client) {
        await client.focus()
        return client.navigate(url)
      }
    }
    return self.clients.openWindow(url)
  })())
})
