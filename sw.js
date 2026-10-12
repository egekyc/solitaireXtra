// Offline support: the app shell is cached on install; Google Fonts are cached the first time they load.
const VERSION = 'pixel-solitaire-v2';
const SHELL = [
  './',
  'index.html',
  'css/style.css',
  'js/util.js',
  'js/pixel.js',
  'js/data/geo.js',
  'js/data/fandom.js',
  'js/klondike.js',
  'js/category.js',
  'js/board.js',
  'js/fx.js',
  'js/app.js',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const put = (req, res) => {
  const copy = res.clone();
  caches.open(VERSION).then((c) => c.put(req, copy));
  return res;
};

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Own files: network first so updates show up, cache as the offline fallback.
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req)
        .then((res) => put(req, res))
        .catch(() => caches.match(req).then((hit) => hit || caches.match('index.html')))
    );
    return;
  }

  // Fonts never change at a given URL: cache first.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => put(req, res))));
  }
});
