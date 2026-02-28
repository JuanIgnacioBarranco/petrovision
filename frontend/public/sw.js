// ============================================================
// PetroVision — Service Worker (PWA + Push Notifications)
// ============================================================

const CACHE_NAME = 'petrovision-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
];

// ── Install: cache static shell ────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ─────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first for API, cache-first for assets ───
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never cache API / WebSocket requests
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/ws')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          // Cache successful GET requests
          if (response.ok && event.request.method === 'GET') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached); // fallback to cache on network error

      return cached || fetchPromise;
    })
  );
});

// ── Push Notification ──────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'PetroVision — Alarma', body: 'Nueva alarma detectada' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || 'Alarma industrial detectada',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag || 'alarm-notification',
    renotify: true,
    vibrate: [200, 100, 200, 100, 400], // ISA urgency pattern
    data: {
      url: data.url || '/alarms',
      alarm_id: data.alarm_id,
      priority: data.priority,
    },
    actions: [
      { action: 'view', title: 'Ver Alarma' },
      { action: 'dismiss', title: 'Descartar' },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// ── Notification Click ─────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/alarms';

  if (event.action === 'dismiss') return;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing window if available
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Open new window
      return self.clients.openWindow(urlToOpen);
    })
  );
});
