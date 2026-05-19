// Allosticker Service Worker v1
const CACHE = 'allosticker-v1';
const STATIC = [
  '/',
  '/app.html',
  '/index.html',
  '/manifest.json',
  '/allosticker-icon-192.png',
  '/allosticker-icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Supabase & API → toujours réseau
  if(e.request.url.includes('supabase.co') || e.request.url.includes('googleapis')) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) return cached;
      return fetch(e.request).then(resp => {
        // Cache les assets statiques
        if(e.request.method === 'GET' && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => {
        // Offline fallback
        if(e.request.destination === 'document') {
          return caches.match('/app.html');
        }
      });
    })
  );
});

// Notifications push (placeholder)
self.addEventListener('push', e => {
  if(!e.data) return;
  const data = e.data.json();
  e.waitUntil(
    self.registration.showNotification(data.title || 'Allosticker', {
      body: data.body || '',
      icon: '/allosticker-icon-192.png',
      badge: '/allosticker-icon-192.png',
      data: data,
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('/app.html'));
});
