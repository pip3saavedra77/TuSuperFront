self.addEventListener('push', (event: PushEvent) => {
  let data = { title: 'TuSuper', body: '', icon: '/branding/tusuper-logo-new.png' };
  
  try {
    const payload = event.data?.json();
    if (payload) {
      data = { ...data, ...payload };
    }
  } catch {
    // Si no es JSON, usar texto plano
    const text = event.data?.text();
    if (text) data.body = text;
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: '/branding/tusuper-logo-new.png',
      vibrate: [200, 100, 200],
      tag: 'tusuper-notif',
    })
  );
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      if (clients.length > 0) {
        clients[0].focus();
      } else {
        self.clients.openWindow('/home');
      }
    })
  );
});
