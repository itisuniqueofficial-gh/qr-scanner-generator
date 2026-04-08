const CACHE_NAME = 'qr-tools-v1';
const APP_SHELL = [
  '/',
  '/scanner/',
  '/reader/',
  '/generator/',
  '/upi-qr-generator/',
  '/upi-qr-redirect/',
  '/about/',
  '/contact/',
  '/privacy-policy/',
  '/terms/',
  '/404.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/assets/css/style.css',
  '/assets/js/main.js',
  '/assets/js/scanner.js',
  '/assets/js/reader.js',
  '/assets/js/generator.js',
  '/assets/js/upi-generator.js',
  '/assets/js/upi-redirect.js',
  '/assets/vendor/jsqr.min.js',
  '/assets/vendor/qrcode.min.js',
  '/assets/images/favicon.svg',
  '/assets/images/og-image.svg',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/assets/icons/maskable-icon-192.png',
  '/assets/icons/maskable-icon-512.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(function (response) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, copy);
          });
          return response;
        })
        .catch(function () {
          return caches.match(event.request).then(function (cachedPage) {
            return cachedPage || caches.match('/offline.html');
          });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request)
        .then(function (response) {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseCopy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, responseCopy);
          });
          return response;
        })
        .catch(function () {
          return caches.match('/offline.html');
        });
    })
  );
});
