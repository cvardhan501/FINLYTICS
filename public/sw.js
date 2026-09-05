const CACHE_VERSION = 'v3';
const STATIC_CACHE_NAME = `finlytics-static-${CACHE_VERSION}`;
const RUNTIME_CACHE_NAME = `finlytics-runtime-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/manifest.json',
  '/logo.svg',
  '/logo.png',
  '/fin-logo.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
  '/favicon.png',
  '/favicon.ico',
];

// Install Event: Pre-cache static assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[FINLYTICS PWA] Static pre-caching partial error:', err);
      });
    })
  );
});

// Activate Event: Clean up outdated caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== RUNTIME_CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Helper: Check if request is safe for Cache API
function isCacheableRequest(request, url) {
  if (!url || (url.protocol !== 'http:' && url.protocol !== 'https:')) {
    return false;
  }
  if (url.pathname.includes('/_next/webpack-hmr')) {
    return false;
  }
  if (url.pathname.startsWith('/api/')) {
    return false;
  }
  if (url.searchParams.has('_rsc')) {
    return false;
  }
  return true;
}

// Fetch Event Handler: Safe, non-blocking fetch wrapper
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch (e) {
    return;
  }

  // Reject unsupported schemes (chrome-extension://, moz-extension://, etc.)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // Bypass service worker caching for API routes, HMR, and Next.js RSC data
  if (url.pathname.startsWith('/api/') || url.pathname.includes('/_next/webpack-hmr') || url.searchParams.has('_rsc')) {
    return;
  }

  // For localhost development navigation requests, use network-first bypass
  const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (isLocalhost && request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/').then((match) => match || new Response('Offline', { status: 503 }));
      })
    );
    return;
  }

  // General safe fetch strategy
  event.respondWith(
    (async () => {
      try {
        // Try network first for HTML navigation
        if (request.mode === 'navigate') {
          try {
            const networkResponse = await fetch(request);
            if (networkResponse && networkResponse.ok && isCacheableRequest(request, url)) {
              const cache = await caches.open(RUNTIME_CACHE_NAME);
              cache.put(request, networkResponse.clone()).catch(() => {});
            }
            return networkResponse;
          } catch (netErr) {
            const cachedMatch = await caches.match(request);
            if (cachedMatch) return cachedMatch;
            const rootMatch = await caches.match('/');
            if (rootMatch) return rootMatch;
            return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/html' } });
          }
        }

        // Cache first for static assets (images, icons, styles)
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          // Asynchronously revalidate static assets
          fetch(request)
            .then(async (networkResponse) => {
              if (networkResponse && networkResponse.ok && isCacheableRequest(request, url)) {
                const cache = await caches.open(STATIC_CACHE_NAME);
                cache.put(request, networkResponse).catch(() => {});
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        // Network fallback
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.ok && isCacheableRequest(request, url)) {
          const responseClone = networkResponse.clone();
          caches.open(STATIC_CACHE_NAME).then((cache) => {
            cache.put(request, responseClone).catch(() => {});
          });
        }
        return networkResponse;
      } catch (err) {
        // Safe ultimate fallback: never return undefined/null or uncaught promise rejection
        const fallbackMatch = await caches.match(request);
        if (fallbackMatch) return fallbackMatch;
        return new Response('', { status: 404, statusText: 'Resource Not Available' });
      }
    })()
  );
});
