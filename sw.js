// Allosticker Service Worker v3
const CACHE = 'allosticker-v3';
const STATIC = ['/manifest.json', '/allosticker-icon-192.png', '/allosticker-icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  // Ne jamais cacher app.html, index.html — toujours réseau
  if (e.request.url.includes('app.html') || e.request.url.includes('index.html')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  // Ne jamais cacher les appels Supabase/Netlify
  if (e.request.url.includes('supabase.co') || e.request.url.includes('netlify') || e.request.url.includes('googleapis')) return;
  // Cache normal pour les autres ressources statiques
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (e.request.method === 'GET' && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => {
        if (e.request.destination === 'document') return caches.match('/app.html');
      });
    })
  );
});

self.addEventListener('push', e => {
  if (!e.data) return;
  let data = {};
  try { data = e.data.json(); } catch(err) { data = { title: 'Allosticker', body: e.data.text() }; }
  e.waitUntil(
    self.registration.showNotification(data.title || 'Allosticker 🎴', {
      body: data.body || '',
      icon: '/allosticker-icon-192.png',
      badge: '/allosticker-icon-192.png',
      tag: data.tag || 'allosticker',
      data: data,
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/app.html';
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(wins => {
      const w = wins.find(w => w.url.includes('allosticker.fr'));
      if (w) { w.focus(); } else { clients.openWindow(url); }
    })
  );
});
