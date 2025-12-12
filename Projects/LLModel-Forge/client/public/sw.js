// LLModel-Forge Service Worker
// Provides offline support, caching, and background sync

const CACHE_NAME = 'llmodel-forge-v1';
const STATIC_CACHE = 'llmodel-forge-static-v1';
const DYNAMIC_CACHE = 'llmodel-forge-dynamic-v1';
const API_CACHE = 'llmodel-forge-api-v1';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS).catch((err) => {
          console.log('[SW] Cache addAll failed:', err);
        });
      })
      .catch((err) => {
        console.log('[SW] Cache open failed:', err);
      })
  );

  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== API_CACHE)
            .map((key) => {
              console.log('[SW] Deleting old cache:', key);
              return caches.delete(key);
            })
        );
      })
      .catch((err) => {
        console.log('[SW] Cache cleanup failed:', err);
      })
  );

  // Claim all clients
  self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip WebSocket connections
  if (url.protocol === 'ws:' || url.protocol === 'wss:') {
    return;
  }

  // API requests - Network first, then cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // Static assets - Cache first, then network
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // Dynamic content - Stale while revalidate
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// Cache first strategy - good for static assets
async function cacheFirstStrategy(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Cache first fetch failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Network first strategy - good for API calls
async function networkFirstStrategy(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Stale while revalidate - good for dynamic content
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || networkPromise;
}

// Check if request is for static asset
function isStaticAsset(pathname) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.woff', '.woff2'];
  return staticExtensions.some((ext) => pathname.endsWith(ext));
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-predictions') {
    event.waitUntil(syncPredictions());
  }

  if (event.tag === 'sync-experiments') {
    event.waitUntil(syncExperiments());
  }
});

async function syncPredictions() {
  // Sync offline predictions when back online
  const db = await openDB();
  const predictions = await db.getAll('offline-predictions');

  for (const prediction of predictions) {
    try {
      await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prediction),
      });
      await db.delete('offline-predictions', prediction.id);
    } catch (error) {
      console.error('[SW] Failed to sync prediction:', error);
    }
  }
}

async function syncExperiments() {
  // Similar sync logic for experiments
  console.log('[SW] Syncing experiments...');
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  const data = event.data?.json() || {
    title: 'LLModel-Forge',
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.png',
  };

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [200, 100, 200],
      data: data.url || '/',
      actions: [
        { action: 'view', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    })
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data || '/');
      }
    })
  );
});

// Simple IndexedDB helper
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('llmodel-forge-offline', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offline-predictions')) {
        db.createObjectStore('offline-predictions', { keyPath: 'id' });
      }
    };
  });
}

console.log('[SW] Service worker loaded');

