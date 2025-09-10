// Version-based cache name (only changes on actual updates)
// Note: This should be updated manually when deploying or automated in your build process
const CACHE_VERSION = '0.1.6'
const CACHE_NAME = `wordgrid-v${CACHE_VERSION}`
const urlsToCache = [
  '/',
  '/manifest.json',
  '/Wordgridsm.webp',
  '/favicon.ico',
  // Add other static assets as needed
]

// Strategy configuration
const NETWORK_FIRST_URLS = ['/', '/api/']  // Always get fresh content
const CACHE_FIRST_URLS = ['/Wordgridsm.webp', '/favicon.ico', '/manifest.json'] // Static assets
const STALE_WHILE_REVALIDATE_URLS = ['.js', '.css'] // JS/CSS with background updates

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

// Optimized fetch event with different strategies
self.addEventListener('fetch', (event) => {
  // Only handle same-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }

  const url = new URL(event.request.url)
  const isNetworkFirst = NETWORK_FIRST_URLS.some(pattern => 
    url.pathname.startsWith(pattern)
  )
  const isCacheFirst = CACHE_FIRST_URLS.some(pattern => 
    url.pathname.includes(pattern)
  )
  const isStaleWhileRevalidate = STALE_WHILE_REVALIDATE_URLS.some(ext => 
    url.pathname.includes(ext)
  )

  if (isNetworkFirst || event.request.destination === 'document') {
    // Network-first strategy for HTML pages and API calls
    event.respondWith(
      fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }
        return response
      }).catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('Service Worker: Serving from cache (offline)', event.request.url)
            return cachedResponse
          }
          if (event.request.destination === 'document') {
            return caches.match('/')
          }
          throw new Error('No cached response available')
        })
      })
    )
  } else if (isCacheFirst) {
    // Cache-first strategy for static assets that rarely change
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          console.log('Service Worker: Serving from cache', event.request.url)
          return response
        }
        return fetch(event.request).then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache)
            })
          }
          return response
        })
      })
    )
  } else if (isStaleWhileRevalidate) {
    // Stale-while-revalidate strategy for JS/CSS (fast + fresh)
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // Always try to fetch fresh version in background
        const fetchPromise = fetch(event.request).then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache)
            })
          }
          return response
        })
        
        // Return cached version immediately if available, otherwise wait for network
        return cachedResponse || fetchPromise
      })
    )
  } else {
    // Default: Network-first with cache fallback
    event.respondWith(
      fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }
        return response
      }).catch(() => {
        return caches.match(event.request)
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
