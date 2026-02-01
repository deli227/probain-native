
// Version injectee automatiquement par le script post-build
const CACHE_VERSION = '__BUILD_TIMESTAMP__';
const CACHE_NAME = `probain-${CACHE_VERSION}`;

const PRECACHE_ASSETS = [
  '/lovable-uploads/55d72ff9-d45a-4285-a7e0-f048150b6823.png',
  '/lovable-uploads/44717df9-d0fb-47ab-bed0-bdcc83266ac5.png',
  '/lovable-uploads/94ab2d23-73d1-4142-a0ef-4271ec18c73e.png',
  '/lovable-uploads/d7f5db6d-57a6-4eb2-a8cc-9591021aef86.png'
];

// Install: precache les images statiques + activer immediatement
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: precachage des ressources statiques');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
});

// Activate: purger les anciens caches + prendre le controle immediatement
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('SW: suppression ancien cache', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch: strategie intelligente selon le type de ressource
self.addEventListener('fetch', (event) => {
  // Ignorer les requetes non-GET, API Supabase, et URLs non-HTTP
  if (
    event.request.method !== 'GET' ||
    event.request.url.includes('supabase.co') ||
    event.request.url.includes('cdn.gpteng.co') ||
    !event.request.url.startsWith('http')
  ) {
    return;
  }

  const url = new URL(event.request.url);

  // Assets avec hash dans le nom (main.a1b2c3.js) → cache-first (safe, le nom change a chaque build)
  if (url.pathname.startsWith('/assets/') && /\.[a-f0-9]{8,}\./.test(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
          }
          return response;
        });
      })
    );
    return;
  }

  // HTML / navigation / tout le reste → network-first (toujours la derniere version)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
        }
        return response;
      })
      .catch(() => {
        // Offline: fallback sur le cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          return new Response('Hors ligne - Contenu non disponible', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' }),
          });
        });
      })
  );
});

// Gestion des notifications push
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'Nouvelle notification',
      icon: '/lovable-uploads/20286da1-b072-432d-b68e-3b0e839dd1b9.png',
      badge: '/lovable-uploads/20286da1-b072-432d-b68e-3b0e839dd1b9.png',
      data
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'ProBain', options)
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
