const CACHE_NAME = 'bentocare-offline-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([OFFLINE_URL, '/icon.svg']))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((names) =>
        Promise.all(
          names
            .filter((name) => name.startsWith('bentocare-offline-') && name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      ),
      self.clients.claim(),
    ])
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate' || new URL(event.request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request).catch(async () =>
      (await caches.match(OFFLINE_URL)) || Response.error()
    )
  );
});
