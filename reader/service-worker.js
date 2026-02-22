/**
 * @fileoverview Service Worker for PWA capabilities
 * Provides offline support, caching strategies, and background sync
 */

const CACHE_NAME = 'reader-v2.3.5-features';
const RUNTIME_CACHE = 'reader-runtime-v3';

// Assets to cache on install
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/css/base.css',
  './assets/css/layout.css',
  './assets/css/animations.css',
  './assets/css/main.css',
  './assets/css/flashcards.css',
  './assets/css/library.css',
  './assets/css/reader.css',
  './assets/css/reader-ui.css',
  './assets/css/components.css',
  './assets/css/mobile.css',
  './assets/css/components/button.css',
  './assets/css/components/card.css',
  './assets/css/components/dropzone.css',
  './assets/css/components/modal.css',
  './assets/css/components/skeleton.css',
  './assets/css/components/toast.css',
  './assets/css/views/library.css',
  './assets/css/views/reader.css',
  './assets/css/components/word-popover.css',
  './assets/js/core/router.js',
  './assets/js/core/event-bus.js',
  './assets/js/core/state-manager.js',
  './assets/js/views/LibraryView.js',
  './assets/js/views/FlashcardsView.js',
  './assets/js/views/ReaderView.js',
  './assets/js/views/StatisticsView.js',
  './assets/js/vocabulary/vocabulary-storage.js',
  './assets/js/utils/viewport-height.js',
  './assets/js/utils/error-boundary.js',
  './assets/js/utils/logger.js',
  './assets/js/a11y/keyboard-navigator.js',
  './assets/js/parsers/fb2-parser.js',
  './assets/js/parsers/epub-parser.js',
  './assets/js/workers/book-parser.worker.js'
];

// Install event - cache assets and activate immediately
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Precaching assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// Activate event - claim all clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(async function() {
    await self.clients.claim(); // Take control of all pages immediately

    // Enable navigation preload if supported (for faster app shell loading)
    if (self.registration.navigationPreload) {
      await self.registration.navigationPreload.enable();
    }
  }());
});

// Activate event - clean old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(async function() {
    // Clean old caches
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => {
        if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
          console.log('[Service Worker] Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        }
      })
    );

    await self.clients.claim(); // Take control of all pages immediately

    // Enable navigation preload if supported
    if (self.registration.navigationPreload) {
      await self.registration.navigationPreload.enable();
    }
  }());
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Handle book images from IndexedDB
  if (url.pathname.startsWith('/book-images/')) {
    event.respondWith(handleBookImage(request));
    return;
  }

  // Network first for API calls
  if (url.pathname.includes('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Cache first for assets
  event.respondWith(cacheFirst(request));
});

/**
 * Handle book image requests from IndexedDB
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleBookImage(request) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean); // Remove empty parts

    // Expected format: /book-images/{bookId}/{imagePath}
    // After split: ['book-images', 'bookId', 'imagePathPart1', 'imagePathPart2', ...]
    if (pathParts.length < 3 || pathParts[0] !== 'book-images') {
      console.warn('[Service Worker] Invalid image URL format:', url.pathname);
      return createErrorResponse('Invalid image path', 400);
    }

    const bookId = pathParts[1];
    const imagePath = pathParts.slice(2).join('/'); // Reconstruct path with slashes

    // 🛡️ SECURITY CHECK: Prevent path traversal attacks
    if (imagePath.includes('..') || imagePath.includes('//') || imagePath.startsWith('/')) {
      console.warn('[Security] Suspicious path detected:', imagePath);
      return createErrorResponse('Forbidden', 403);
    }

    if (!bookId || !imagePath) {
      console.warn('[Service Worker] Missing bookId or imagePath:', { bookId, imagePath });
      return createErrorResponse('Missing bookId or imagePath', 400);
    }

    console.log(`[Service Worker] Serving book image: ${bookId}/${imagePath}`);

    // Try OPFS first (faster for large files)
    let blob = null;
    if (navigator.storage && navigator.storage.getDirectory) {
      try {
        const root = await navigator.storage.getDirectory();
        const bookDir = await root.getDirectoryHandle(bookId);

        // Navigate to nested directories
        const pathParts = imagePath.split('/');
        const fileName = pathParts.pop();
        let currentDir = bookDir;

        for (const part of pathParts) {
          currentDir = await currentDir.getDirectoryHandle(part);
        }

        const fileHandle = await currentDir.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        blob = file;
        console.log(`[Service Worker] Served from OPFS: ${imagePath}`);
      } catch (opfsError) {
        console.log(`[Service Worker] OPFS not available, falling back to IndexedDB:`, opfsError.message);
      }
    }

    // Fallback to IndexedDB
    if (!blob) {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open('ReaderDB');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      const transaction = db.transaction(['imageBlobs'], 'readonly');
      const store = transaction.objectStore('imageBlobs');
      const getRequest = store.get(`${bookId}:${imagePath}`);

      const result = await new Promise((resolveResult, rejectResult) => {
        getRequest.onsuccess = () => resolveResult(getRequest.result);
        getRequest.onerror = () => rejectResult(getRequest.error);
      });

      blob = result ? result.blob : null;
      if (blob) {
        console.log(`[Service Worker] Served from IndexedDB: ${imagePath}`);
      }
    }

    // 🔍 DEBUG: Log final blob details before serving
    if (blob) {
      console.log(`🖼️ [Service Worker] Serving blob for ${bookId}:${imagePath}`, {
        size: blob.size,
        type: blob.type,
        isBlob: blob instanceof Blob,
        firstBytes: await getBlobFirstBytes(blob, 16)
      });
    } else {
      console.error(`❌ [Service Worker] No blob found for ${bookId}:${imagePath}`);
    }

    if (blob) {
      console.log(`[Service Worker] Image served: ${imagePath} (${blob.size} bytes, type: ${blob.type})`);
      return new Response(blob, {
        headers: {
          'Content-Type': blob.type || 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
        }
      });
    } else {
      console.warn(`[Service Worker] Image not found: ${bookId}:${imagePath}`);
      return createErrorResponse('Image not found', 404);
    }

  } catch (error) {
    console.error('[Service Worker] Error serving book image:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * Create consistent error responses
 * @param {string} message
 * @param {number} status
 * @returns {Response}
 */
function createErrorResponse(message, status) {
  // For images, we could return a small placeholder SVG instead of plain text
  if (status === 404) {
    const placeholderSvg = `
      <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="#f0f0f0"/>
        <text x="50" y="50" text-anchor="middle" dy=".3em" fill="#999" font-size="12">Image not found</text>
      </svg>
    `;
    return new Response(placeholderSvg, {
      status: 404,
      headers: { 'Content-Type': 'image/svg+xml' }
    });
  }

  return new Response(message, { status });
}

/**
 * Cache-first strategy
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.status === 200) {
      const runtimeCache = await caches.open(RUNTIME_CACHE);
      runtimeCache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[Service Worker] Fetch failed:', error);
    
    // Return offline page if available
    const offlinePage = await cache.match('./offline.html');
    if (offlinePage) {
      return offlinePage;
    }
    
    return new Response('Offline - content not available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

/**
 * Network-first strategy with cache fallback
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  
  try {
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[Service Worker] Network request failed, using cache:', error);
    
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    
    return new Response('Offline - data not available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-vocabulary') {
    event.waitUntil(syncVocabulary());
  }
});

/**
 * Sync vocabulary data
 */
async function syncVocabulary() {
  console.log('[Service Worker] Syncing vocabulary...');
  // Implementation would sync with backend if available
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Time to review your flashcards!',
    icon: './assets/images/icons/book.svg',
    badge: './assets/images/icons/book.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('Reader - Study Reminder', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/#/flashcards')
  );
});

/**
 * Get first N bytes of a blob as hex string for debugging
 * @param {Blob} blob
 * @param {number} bytes
 * @returns {string}
 */
async function getBlobFirstBytes(blob, bytes = 16) {
  try {
    const arrayBuffer = await blob.slice(0, bytes).arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    return Array.from(uint8Array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join(' ');
  } catch (error) {
    return `ERROR: ${error.message}`;
  }
}

console.log('[Service Worker] Loaded');

