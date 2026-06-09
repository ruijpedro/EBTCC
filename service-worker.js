const CACHE_NAME = "inspecoes-rjp-v1-6";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./src/styles.css",
  "./src/app.js",
  "./src/data/stations.js",
  "./src/data/checklist.js",
  "./src/pdf/printFicha.js",
  "./src/google/config.js",
  "./src/google/googleSync.js",
  "./assets/ip-logo.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener("fetch", event => {
  event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)));
});
