/**
 * Mumtaz AI — Service Worker
 * Handles: offline caching, push notifications, background sync
 */

const CACHE_VERSION = 'ola-v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;

// ============================================
// STATIC ASSETS TO PRE-CACHE
// ============================================
const PRECACHE_URLS = [
  '/',
  '/chat',
  '/dashboard',
  '/offline',
  '/site.webmanifest',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-icon.png',
  '/favicon.ico',
];

// ============================================
// INSTALL — Pre-cache shell assets
// ============================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Pre-caching app shell');
        // Use addAll with individual catches so one failure doesn't block install
        return Promise.allSettled(
          PRECACHE_URLS.map((url) =>
            cache.add(url).catch((err) => {
              console.warn(`[SW] Failed to pre-cache ${url}:`, err.message);
            })
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// ============================================
// ACTIVATE — Clean old caches
// ============================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key !== STATIC_CACHE &&
                key !== DYNAMIC_CACHE &&
                key !== IMAGE_CACHE
            )
            .map((key) => {
              console.log('[SW] Deleting old cache:', key);
              return caches.delete(key);
            })
        )
      )
      .then(() => self.clients.claim())
  );
});

// ============================================
// FETCH — Caching strategies
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, cross-origin, chrome-extension, etc.
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // Don't cache API calls, auth routes, or SSE streams
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/webpack-hmr') ||
    url.pathname.includes('_rsc')
  ) {
    return;
  }

  // Strategy: Cache-first for static assets (JS, CSS, fonts)
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(js|css|woff2?|ttf|eot)$/)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Strategy: Cache-first for images
  if (
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|avif)$/) ||
    url.pathname.startsWith('/images/')
  ) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, 7 * 24 * 60 * 60));
    return;
  }

  // Strategy: Network-first for HTML/pages (dynamic content)
  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

// ============================================
// CACHING STRATEGIES
// ============================================

/**
 * Cache-first: return cached version, fall back to network
 */
async function cacheFirst(request, cacheName, maxAge) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline') || new Response('Offline', { status: 503 });
    }
    throw err;
  }
}

/**
 * Network-first: try network, fall back to cache
 */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/offline');
      if (offlinePage) return offlinePage;
    }

    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

// ============================================
// PUSH NOTIFICATIONS
// ============================================
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');

  let data = {
    title: 'Mumtaz AI',
    body: 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/favicon-48x48.png',
    tag: 'default',
    url: '/',
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/favicon-48x48.png',
    tag: data.tag || 'ola-notification',
    renotify: true,
    requireInteraction: data.requireInteraction || false,
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
    },
    actions: data.actions || [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing tab if one matches
      for (const client of clients) {
        if (new URL(client.url).pathname === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      return self.clients.openWindow(targetUrl);
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification dismissed');
});

// ============================================
// BACKGROUND SYNC (for offline message queuing)
// ============================================
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-messages') {
    event.waitUntil(syncPendingMessages());
  }
});

async function syncPendingMessages() {
  try {
    // Check for pending messages in IndexedDB
    // This will be implemented when background message queuing is added
    console.log('[SW] Syncing pending messages...');
  } catch (err) {
    console.error('[SW] Sync failed:', err);
  }
}

// ============================================
// MESSAGE HANDLING (from main thread)
// ============================================
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data?.type === 'CACHE_URLS') {
    const urls = event.data.urls || [];
    event.waitUntil(
      caches.open(DYNAMIC_CACHE).then((cache) =>
        Promise.allSettled(urls.map((url) => cache.add(url).catch(() => {})))
      )
    );
  }

  if (event.data?.type === 'CLEAR_CACHES') {
    event.waitUntil(
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
    );
  }
});
