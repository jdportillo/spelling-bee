const CACHE  = 'beespeller-v1';
const ASSETS = ['/', '/index.html', '/manifest.json'];

/* Install — cache shell */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

/* Activate — clean old caches */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* Fetch — network-first for Firebase/API, cache-first for shell */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  /* Always network for Firebase, dictionaryapi, fonts */
  if (url.hostname.includes('firebase') ||
      url.hostname.includes('googleapis') ||
      url.hostname.includes('gstatic') ||
      url.hostname.includes('dictionaryapi')) {
    return; /* let browser handle normally */
  }

  /* Cache-first for same-origin assets (the app shell) */
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        }).catch(() => caches.match('/index.html'));
      })
    );
  }
});
