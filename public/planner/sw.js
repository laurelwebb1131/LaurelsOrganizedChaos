const CACHE = 'loc-planner-step2-v4b';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './payload/style-0.txt',
  './payload/style-1.txt',
  './payload/app-0.txt',
  './payload/app-1.txt',
  './payload/app-2.txt',
  './payload/app-3.txt',
  './payload/step2-style-a.txt',
  './payload/step2-style-b.txt',
  './payload/step2-style-c.txt',
  './payload/step2-app-0.txt'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(hit =>
      hit || fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match('./index.html'))
    )
  );
});
