import { NextResponse } from 'next/server'

export async function GET() {
  const swContent = `
// Service Worker for Vibe Coding PWA
const CACHE_NAME = 'vibe-coding-v1'
const STATIC_CACHE = 'vibe-coding-static-v1'
const DYNAMIC_CACHE = 'vibe-coding-dynamic-v1'

// Files to cache on install
const STATIC_FILES = [
  '/',
  '/dashboard',
  '/ai-chat',
  '/manifest.json',
  '/_next/static/chunks/main.js',
  '/_next/static/chunks/webpack.js',
  '/_next/static/chunks/framework.js',
]

// Install event - cache static files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_FILES))
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => 
            cacheName !== STATIC_CACHE && 
            cacheName !== DYNAMIC_CACHE
          )
          .map(cacheName => caches.delete(cacheName))
      )
    })
  )
})

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip external requests
  if (url.origin !== location.origin) {
    return
  }

  // Handle different request types
  if (url.pathname.startsWith('/api/')) {
    // API requests - network first, fallback to cache
    event.respondWith(networkFirst(request))
  } else if (STATIC_FILES.includes(url.pathname) || url.pathname === '/') {
    // Static files - cache first
    event.respondWith(cacheFirst(request))
  } else {
    // Dynamic content - network first with cache fallback
    event.respondWith(networkFirst(request))
  }
})

// Network first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request)
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request)
    return cachedResponse || new Response('Offline', { 
      status: 503,
      statusText: 'Service Unavailable'
    })
  }
}

// Cache first strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    return new Response('Offline', { 
      status: 503,
      statusText: 'Service Unavailable'
    })
  }
}

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-code-save') {
    event.waitUntil(syncCodeChanges())
  }
})

// Sync pending code changes when back online
async function syncCodeChanges() {
  try {
    // Get pending changes from IndexedDB
    const pendingChanges = await getPendingChanges()
    
    for (const change of pendingChanges) {
      try {
        await fetch('/api/projects/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(change),
        })
        
        // Remove synced change from IndexedDB
        await removePendingChange(change.id)
      } catch (error) {
        console.error('Failed to sync change:', error)
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

// IndexedDB helpers for offline storage
async function getPendingChanges() {
  // Implementation would use IndexedDB to store pending changes
  return []
}

async function removePendingChange(id) {
  // Implementation would remove change from IndexedDB
}

// Handle push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text(),
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'explore',
        title: 'Open Vibe Coding',
        icon: '/icons/checkmark.png',
      },
      {
        action: 'close',
        title: 'Close notification',
        icon: '/icons/xmark.png',
      },
    ],
  }

  event.waitUntil(
    self.registration.showNotification('Vibe Coding', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    )
  } else if (event.action === 'close') {
    // Just close the notification
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Periodic background sync for content updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'content-sync') {
    event.waitUntil(syncContent())
  }
})

// Sync content periodically
async function syncContent() {
  try {
    // Fetch latest content updates
    const response = await fetch('/api/sync/content')
    
    if (response.ok) {
      const updates = await response.json()
      
      // Update cached content
      const cache = await caches.open(DYNAMIC_CACHE)
      for (const update of updates) {
        const request = new Request(update.url)
        const response = new Response(JSON.stringify(update.data), {
          headers: { 'Content-Type': 'application/json' }
        })
        cache.put(request, response)
      }
    }
  } catch (error) {
    console.error('Content sync failed:', error)
  }
})

// Cleanup old caches periodically
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    event.skipWaiting()
  }
})
`

  return new NextResponse(swContent, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
