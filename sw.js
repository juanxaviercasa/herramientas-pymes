/**
 * Service Worker para Nube para Pymes PWA
 * Habilita instalación en escritorio (Windows, macOS, Linux) y soporte offline.
 */

const CACHE_NAME = 'nube-para-pymes-v1';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './assets/index.css',
  './assets/index.js',
  './manifest.webmanifest',
  './favicon.png',
  './assets/icon.svg',
  './js/pwa-install.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache parcial:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Solo peticiones GET
  if (request.method !== 'GET') return;

  // Ignorar extensiones o esquemas no soportados (e.g. chrome-extension:)
  if (!request.url.startsWith('http')) return;

  // Estrategia Network-First para documentos de navegación (HTML)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          const fallback = await caches.match('./index.html');
          return fallback || Response.error();
        })
    );
    return;
  }

  // Estrategia Stale-While-Revalidate para recursos estáticos (CSS, JS, imágenes, fuentes)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }
        return networkResponse;
      }).catch(() => {
        // En caso de fallo de red, ya retornamos cachedResponse si existía
      });

      return cachedResponse || fetchPromise;
    })
  );
});
