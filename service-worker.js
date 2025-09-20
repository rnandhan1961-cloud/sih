// Shiksha Leap Service Worker - Offline-First PWA
const CACHE_NAME = 'shiksha-leap-v1.0.0';
const STATIC_CACHE = 'shiksha-static-v1';
const DYNAMIC_CACHE = 'shiksha-dynamic-v1';

// Core assets that must be cached for offline functionality
const CORE_ASSETS = [
  '/',
  '/static/css/style.css',
  '/static/js/main.js',
  '/static/js/auth.js',
  '/static/js/db_sync.js',
  '/static/js/tf.min.js',
  '/static/js/chart.min.js',
  '/static/images/logo.png',
  '/static/locales/en.json',
  '/static/locales/hi.json',
  '/static/locales/ta.json',
  '/static/locales/od.json',
  '/manifest.json'
];

// Game assets to cache (will be populated dynamically)
const GAME_ASSETS = [
  '/games/grade_6/english/game1/',
  '/games/grade_6/maths/game1/',
  '/games/grade_7/english/game1/',
  '/games/grade_8/english_quiz.json',
  '/games/grade_8/maths_quiz.json'
];

// ML Models for offline AI
const ML_MODELS = [
  '/static/ml_models/knowledge_tracer.tflite',
  '/static/ml_models/contextual_bandit.tflite'
];

// All assets to cache
const ASSETS_TO_CACHE = [...CORE_ASSETS, ...GAME_ASSETS, ...ML_MODELS];

// Install event - cache core assets
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Service Worker: Caching core assets');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Core assets cached');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Failed to cache core assets', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets and pages
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          console.log('Service Worker: Serving from cache', request.url);
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(request)
          .then(networkResponse => {
            // Don't cache non-successful responses
            if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clone the response
            const responseToCache = networkResponse.clone();

            // Determine which cache to use
            const cacheToUse = shouldCacheInStatic(request.url) ? STATIC_CACHE : DYNAMIC_CACHE;

            // Add to cache
            caches.open(cacheToUse)
              .then(cache => {
                cache.put(request, responseToCache);
              });

            return networkResponse;
          })
          .catch(() => {
            // Network failed, try to serve offline fallback
            return handleOfflineFallback(request);
          });
      })
    );
});

// Handle API requests with offline support
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first for API requests
    const networkResponse = await fetch(request);
    
    // Cache successful GET requests
    if (request.method === 'GET' && networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: API request failed, checking cache', request.url);
    
    // Network failed, try cache for GET requests
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // Return offline response for failed API requests
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This feature requires an internet connection',
        offline: true
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

// Determine if URL should be cached in static cache
function shouldCacheInStatic(url) {
  return CORE_ASSETS.some(asset => url.includes(asset)) ||
         url.includes('/static/') ||
         url.includes('/games/') ||
         url.includes('/locales/');
}

// Handle offline fallbacks
async function handleOfflineFallback(request) {
  const url = new URL(request.url);
  
  // For HTML pages, serve a generic offline page
  if (request.headers.get('Accept').includes('text/html')) {
    const cache = await caches.open(STATIC_CACHE);
    return cache.match('/') || new Response(
      `<!DOCTYPE html>
      <html>
      <head>
        <title>Offline - Shiksha Leap</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .offline-message { max-width: 400px; margin: 0 auto; }
        </style>
      </head>
      <body>
        <div class="offline-message">
          <h1>You're Offline</h1>
          <p>Please check your internet connection and try again.</p>
          <button onclick="window.location.reload()">Retry</button>
        </div>
      </body>
      </html>`,
      {
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
  
  // For other requests, return a generic offline response
  return new Response('Offline', { status: 503 });
}

// Background sync for offline data
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'sync-game-logs') {
    event.waitUntil(syncGameLogs());
  }
  
  if (event.tag === 'sync-achievements') {
    event.waitUntil(syncAchievements());
  }
});

// Sync game logs when back online
async function syncGameLogs() {
  try {
    // This would typically get data from IndexedDB and sync with server
    console.log('Service Worker: Syncing game logs...');
    
    // Send message to main thread to handle sync
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_GAME_LOGS'
      });
    });
  } catch (error) {
    console.error('Service Worker: Failed to sync game logs', error);
  }
}

// Sync achievements when back online
async function syncAchievements() {
  try {
    console.log('Service Worker: Syncing achievements...');
    
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_ACHIEVEMENTS'
      });
    });
  } catch (error) {
    console.error('Service Worker: Failed to sync achievements', error);
  }
}

// Handle push notifications (for future use)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/static/images/icon-192.png',
      badge: '/static/images/badge.png',
      vibrate: [200, 100, 200],
      data: data.data || {},
      actions: [
        {
          action: 'open',
          title: 'Open App'
        },
        {
          action: 'close',
          title: 'Close'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Periodic background sync (for future use)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'content-sync') {
    event.waitUntil(syncContent());
  }
});

async function syncContent() {
  try {
    console.log('Service Worker: Periodic content sync');
    // Sync new learning content, games, etc.
  } catch (error) {
    console.error('Service Worker: Periodic sync failed', error);
  }
}