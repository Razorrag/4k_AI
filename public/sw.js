// Optimized Service Worker for caching processed images and improving performance
const CACHE_NAME = 'ai-image-enhancer-v2';
const STATIC_CACHE_NAME = 'ai-image-enhancer-static-v2';

// Files to cache on install - only critical assets
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/vite.svg'
];

// Install event - cache critical assets only
self.addEventListener('install', (event) => {
  console.log('[SW] Installing optimized service worker');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching critical assets');
        return cache.addAll(CRITICAL_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches with improved logic
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating optimized service worker');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(name => name !== STATIC_CACHE_NAME && name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Optimized fetch event - serve from cache when possible
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip external and special URLs (data:, blob:, etc.)
  if (url.origin !== location.origin || 
      request.url.includes('data:') || 
      request.url.includes('blob:')) {
    return;
  }
  
  // Handle different request types with optimized strategy
  if (url.pathname.includes('/api/')) {
    // API requests use network-first with cache fallback
    event.respondWith(networkFirst(request));
  } else if (/\.(png|jpe?g|webp|gif|svg)$/i.test(url.pathname)) {
    // Image requests use cache-first for performance
    event.respondWith(cacheFirst(request));
  } else {
    // All other static assets use cache-first
    event.respondWith(cacheFirst(request));
  }
});

// Optimized network-first strategy for API requests
async function networkFirst(request) {
  try {
    // Try network first
    const response = await fetch(request);
    
    // Cache successful responses (only if response is ok)
    if (response.ok) {
      // Skip caching large responses to avoid storage issues
      const contentLength = response.headers.get('content-length');
      const sizeLimit = 10 * 1024 * 1024; // 10MB limit
      
      if (!contentLength || parseInt(contentLength) < sizeLimit) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
      }
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error);
    
    // Fallback to cache if available
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // For HTML requests, return a minimal offline page
    if (request.headers.get('accept')?.includes('text/html')) {
      return new Response(
        '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>Offline - Please check your connection</h1></body></html>',
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }
    
    throw error;
  }
}

// Optimized cache-first strategy for static assets and images
async function cacheFirst(request) {
  // Try cache first
  let cachedResponse = await caches.match(request);
  if (cachedResponse) {
    // Verify cached response is fresh before returning
    const cacheTime = parseInt(cachedResponse.headers.get('X-Cache-Timestamp') || '0');
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (now - cacheTime < maxAge) {
      return cachedResponse;
    } else {
      // Remove stale cache
      const cache = await caches.open(CACHE_NAME);
      await cache.delete(request);
    }
  }
  
  // Fallback to network
  try {
    const response = await fetch(request);
    
    // Cache successful responses (only if response is ok and not too large)
    if (response.ok) {
      const contentLength = response.headers.get('content-length');
      const sizeLimit = 20 * 1024 * 1024; // 20MB limit for images
      
      if (!contentLength || parseInt(contentLength) < sizeLimit) {
        const cache = await caches.open(CACHE_NAME);
        const responseToCache = new Response(response.clone().body, {
          headers: {
            ...response.headers,
            'X-Cache-Timestamp': Date.now().toString()
          }
        });
        cache.put(request, responseToCache);
      }
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed for cache-first request:', error);
    throw error;
  }
}

// Optimized message handler for cache management
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  
  if (!type) return;
  
  switch (type) {
    case 'CACHE_PROCESSED_IMAGE':
      cacheProcessedImage(payload);
      break;
      
    case 'CLEAR_CACHE':
      clearCache();
      break;
      
    case 'GET_CACHE_SIZE':
      getCacheSize().then(size => {
        event.ports[0]?.postMessage({ size });
      });
      break;
      
    case 'PRUNE_CACHE':
      pruneCache();
      break;
  }
});

// Optimized function to cache processed images
async function cacheProcessedImage({ imageUrl, imageId, metadata }) {
  try {
    if (!imageUrl || !imageUrl.startsWith('data:')) return;
    
    // Skip if cache is getting too large
    const size = await getCacheSize();
    const maxSize = 100 * 1024 * 1024; // 100MB limit
    
    if (size > maxSize) {
      await pruneCache(0.3); // Prune 30% of oldest entries
    }
    
    // Convert data URL to blob
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    // Create cache entry with metadata
    const cache = await caches.open(CACHE_NAME);
    const cacheKey = new Request(`/cached-image/${imageId}`);
    
    // Create a response with metadata in headers
    const cacheResponse = new Response(blob, {
      headers: {
        'Content-Type': blob.type || 'image/png',
        'X-Image-ID': imageId,
        'X-Image-Metadata': JSON.stringify(metadata || {}),
        'X-Cache-Timestamp': Date.now().toString(),
        'Cache-Control': 'max-age=86400' // 24 hours
      }
    });
    
    await cache.put(cacheKey, cacheResponse);
    console.log('[SW] Cached processed image:', imageId);
  } catch (error) {
    console.error('[SW] Failed to cache image:', error);
  }
}

// Optimized function to clear all caches
async function clearCache() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('[SW] Cleared all caches');
  } catch (error) {
    console.error('[SW] Failed to clear caches:', error);
  }
}

// Optimized function to get cache size
async function getCacheSize() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    let totalSize = 0;
    
    // Use Promise.all for concurrent processing but with rate limiting
    const batchSize = 10;
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const responses = await Promise.all(
        batch.map(request => cache.match(request))
      );
      
      for (const response of responses) {
        if (response) {
          const headers = response.headers;
          const contentLength = headers.get('content-length');
          if (contentLength) {
            totalSize += parseInt(contentLength);
          } else {
            // Fallback to reading the body if content-length header is missing
            const blob = await response.blob();
            totalSize += blob.size;
          }
        }
      }
    }
    
    return totalSize;
  } catch (error) {
    console.error('[SW] Failed to get cache size:', error);
    return 0;
  }
}

// New function to prune oldest cache entries
async function pruneCache(percentage = 0.2) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    
    if (requests.length === 0) return;
    
    // Sort requests by cache timestamp to identify oldest entries
    const requestsWithTimestamps = await Promise.all(
      requests.map(async (request) => {
        const response = await cache.match(request);
        const timestamp = parseInt(response?.headers.get('X-Cache-Timestamp') || '0');
        return { request, timestamp };
      })
    );
    
    // Sort by timestamp (oldest first)
    requestsWithTimestamps.sort((a, b) => a.timestamp - b.timestamp);
    
    // Calculate how many entries to remove
    const entriesToRemove = Math.floor(requestsWithTimestamps.length * percentage);
    
    // Remove oldest entries
    const removalPromises = requestsWithTimestamps
      .slice(0, entriesToRemove)
      .map(item => cache.delete(item.request));
    
    await Promise.all(removalPromises);
    console.log(`[SW] Pruned ${entriesToRemove} cache entries`);
  } catch (error) {
    console.error('[SW] Failed to prune cache:', error);
  }
}

// Background sync for offline processing
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-process-image') {
    event.waitUntil(processPendingImages());
  }
});

// Process images that were queued while offline
async function processPendingImages() {
  console.log('[SW] Processing pending images');
  // In a real implementation, this would process queued image tasks
}

// Push notification for completed processing
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    if (data.type === 'PROCESSING_COMPLETE') {
      event.waitUntil(
        self.registration.showNotification('Image Processing Complete', {
          body: `Your image "${data.imageName}" has been enhanced.`,
          icon: '/icon-192x192.png',
          tag: `processing-${data.imageId}`,
          actions: [
            {
              action: 'view',
              title: 'View Image'
            },
            {
              action: 'download',
              title: 'Download'
            }
          ]
        })
      );
    }
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  const { action, notification } = event;
  
  if (action === 'view' || action === 'download') {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
  
  notification.close();
});