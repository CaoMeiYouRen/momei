self.addEventListener('push', (event) => {
  let payload = {}

  if (event.data) {
    try {
      payload = event.data.json()
    } catch {
      payload = {
        body: event.data.text(),
      }
    }
  }

  const title = typeof payload.title === 'string' && payload.title ? payload.title : 'Momei'
  const data = typeof payload.data === 'object' && payload.data !== null ? payload.data : {}

  event.waitUntil(
    self.registration.showNotification(title, {
      body: typeof payload.body === 'string' ? payload.body : '',
      icon: typeof payload.icon === 'string' && payload.icon ? payload.icon : '/favicon.ico',
      badge: typeof payload.badge === 'string' && payload.badge ? payload.badge : '/favicon.ico',
      tag: typeof payload.tag === 'string' ? payload.tag : undefined,
      data,
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const notificationData = event.notification.data || {}
  const targetUrl = new URL(typeof notificationData.url === 'string' ? notificationData.url : '/', self.location.origin).toString()

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus()
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }

      return undefined
    }),
  )
})
