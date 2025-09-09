// Dynamic cache name based on timestamp for cache busting
const CACHE_VERSION = new Date().getTime()
const CACHE_NAME = `wordgrid-v${CACHE_VERSION}`
const urlsToCache = [
  '/',
  '/manifest.json',
  '/Wordgrid.webp',
  // Add other static assets as needed
]

// Network-first strategy for HTML pages to ensure fresh content
const NETWORK_FIRST_URLS = ['/', '/api/']

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files')
        return cache.addAll(urlsToCache)
      })
      .then(() => self.skipWaiting())
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch event - network-first for critical pages, cache-first for assets
self.addEventListener('fetch', (event) => {
  // Only handle same-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }

  const url = new URL(event.request.url)
  const isNetworkFirst = NETWORK_FIRST_URLS.some(pattern => 
    url.pathname.startsWith(pattern)
  )

  if (isNetworkFirst || event.request.destination === 'document') {
    // Network-first strategy for HTML pages and API calls
    event.respondWith(
      fetch(event.request).then((response) => {
        // Cache successful responses
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }
        return response
      }).catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('Service Worker: Serving from cache (offline)', event.request.url)
            return cachedResponse
          }
          // Fallback to index page for navigation requests
          if (event.request.destination === 'document') {
            return caches.match('/')
          }
          throw new Error('No cached response available')
        })
      })
    )
  } else {
    // Cache-first strategy for static assets
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            console.log('Service Worker: Serving from cache', event.request.url)
            return response
          }

          console.log('Service Worker: Fetching from network', event.request.url)
          return fetch(event.request).then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }

            // Clone the response
            const responseToCache = response.clone()

            // Cache the fetched resource
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache)
              })

            return response
          })
        })
        .catch(() => {
          // Fallback for offline scenarios
          if (event.request.destination === 'document') {
            return caches.match('/')
          }
        })
    )
  }
})

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag)
})

// Push notifications (optional for future use)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received')
})
