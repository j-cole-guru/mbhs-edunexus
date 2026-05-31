const CACHE_NAME = 'mbhs-edunexus-v3'

self.addEventListener('install', event => {
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return

  // Skip chrome extension requests
  if (!event.request.url.startsWith('http')) return

  // Skip Supabase API requests — always fetch from network
  if (event.request.url.includes('supabase.co')) return

  // For everything else just fetch from network
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match('/index.html')
    })
  )
})
