const CACHE_NAME = 'menuator-v1';
const STATIC_ASSETS = [
  '/MenuAtor2000/',
  '/MenuAtor2000/index.html',
];

// Install: cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - Google Sheets CSV: network first, no cache (always fresh data)
// - Everything else: cache first, fallback to network
self.addEventListener('fetch', event => {
  const url = event.request.url;

  if (url.includes('docs.google.com')) {
    // Always fetch live from Google Sheets
    event.respondWith(fetch(event.request).catch(() => new Response('[]')));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        // Cache successful responses for static assets
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
