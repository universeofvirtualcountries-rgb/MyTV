/* MyTV — service worker (нужен, чтобы приложение можно было установить на телефон
   и чтобы оно открывалось без интернета). Схема простая и безопасная:
   сначала сеть, при неудаче — копия из кэша. Чужие адреса (Firebase, YouTube)
   не кэшируются и не подменяются. */

const CACHE = 'mytv-v22';
const SHELL = ['./', './MyTV-manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;         // Firebase, YouTube, CDN — не трогаем
  if (url.pathname.indexOf('/__/') === 0) return;      // служебное Firebase Hosting

  e.respondWith(
    fetch(req)
      .then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return resp;
      })
      .catch(() => caches.match(req).then(m => m || caches.match('./index.html')))
  );
});
