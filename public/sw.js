// InvoicePro Service Worker - Auto-purging Network-First Strategy
const CACHE_NAME = 'invoicepro-cache-v6';

// Install: immediately activate without waiting
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate: delete all old caches to guarantee users get fresh bundles
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting stale cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-first for everything to ensure continuous fresh deployments
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET requests or external API calls
  if (req.method !== 'GET') return;
  if (
    url.origin.includes('catalystserverless.in') || 
    url.origin.includes('zohocdn.com') || 
    url.origin.includes('zohomcp.in') || 
    url.origin.includes('supabase.co')
  ) {
    return;
  }

  // Network first with fallback to cache if offline
  event.respondWith(
    fetch(req)
      .then((networkRes) => {
        if (networkRes && networkRes.status === 200 && req.method === 'GET') {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return networkRes;
      })
      .catch(async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        if (req.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      })
  );
});
