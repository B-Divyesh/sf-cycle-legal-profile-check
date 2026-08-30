const CACHE = 'cycle-legal-shell-v4';
const SHELL = ['/', '/manifest.webmanifest', '/favicon.svg', '/assets/route-inspection-hero-mobile.webp', '/assets/route-inspection-hero.webp'];
self.addEventListener('install', (event) => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  const page = await fetch('/');
  const html = await page.clone().text();
  await cache.put('/', page);
  const builtAssets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(match => match[1]);
  // Preloads and page markup can name the same asset. Cache.addAll rejects
  // duplicate request URLs, which would abort the entire worker installation.
  await cache.addAll([...new Set([...SHELL.slice(1), ...builtAssets])]);
  await self.skipWaiting();
})()));
self.addEventListener('activate', (event) => event.waitUntil((async () => {
  await Promise.all((await caches.keys()).filter((key) => key !== CACHE).map((key) => caches.delete(key)));
  await self.clients.claim();
})()));
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).pathname.startsWith('/api/')) return;
  event.respondWith(fetch(event.request).then((response) => {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request).then((cached) => cached || caches.match('/'))));
});
