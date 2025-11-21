// Service Worker for PWA
const CACHE_NAME = 'rps-jobs-v2'
const STATIC_CACHE_NAME = 'rps-jobs-static-v2'

// Install event - cache static resources only
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      // Only cache truly static assets
      return cache.addAll([
        '/manifest.webmanifest',
      ]).catch((error) => {
        console.error('Failed to cache static resources:', error)
      })
    })
  )
  // Force the waiting service worker to become the active service worker
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old cache versions
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  // Take control of all pages immediately
  return self.clients.claim()
})

// Helper function to check if a request should be cached
function shouldCache(request) {
  const url = new URL(request.url)
  
  // Never cache API routes
  if (url.pathname.startsWith('/api/')) {
    return false
  }
  
  // Never cache Next.js internal routes
  if (url.pathname.startsWith('/_next/')) {
    return false
  }
  
  // Cache static assets (images, fonts, icons)
  if (
    url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|ico|woff|woff2|ttf|eot)$/i) ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/Logo')
  ) {
    return true
  }
  
  // Don't cache HTML pages or JS chunks - use network first
  return false
}

// Helper function to check if a request should use network first
function shouldUseNetworkFirst(request) {
  const url = new URL(request.url)
  
  // Use network first for HTML pages and Next.js chunks
  return (
    request.destination === 'document' ||
    request.destination === 'script' ||
    request.destination === 'style' ||
    url.pathname.startsWith('/_next/')
  )
}

// Fetch event - Network First for HTML/JS, Cache First for static assets
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }

  // Never cache API routes - always fetch from network
  const url = new URL(event.request.url)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request))
    return
  }

  // Network First strategy for HTML pages and JS chunks
  if (shouldUseNetworkFirst(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If network succeeds, return response (don't cache)
          return response
        })
        .catch(() => {
          // If network fails, try cache as fallback
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse
            }
            // If no cache, return offline page for documents
            if (event.request.destination === 'document') {
              return caches.match('/').catch(() => new Response('Offline', { status: 503 }))
            }
            return new Response('Network error', { status: 503 })
          })
        })
    )
    return
  }

  // Cache First strategy for static assets only
  if (shouldCache(event.request)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }
        
        return fetch(event.request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }

          // Clone the response for caching
          const responseToCache = response.clone()
          caches.open(STATIC_CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return response
        })
      })
    )
    return
  }

  // For all other requests, just fetch from network (no caching)
  event.respondWith(fetch(event.request))
})

