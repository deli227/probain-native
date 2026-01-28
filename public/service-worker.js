
const CACHE_NAME = 'probain-v1';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/lovable-uploads/55d72ff9-d45a-4285-a7e0-f048150b6823.png',
  '/lovable-uploads/44717df9-d0fb-47ab-bed0-bdcc83266ac5.png',
  '/lovable-uploads/94ab2d23-73d1-4142-a0ef-4271ec18c73e.png',
  '/lovable-uploads/d7f5db6d-57a6-4eb2-a8cc-9591021aef86.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Précachage des ressources');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Ne pas intercepter les requêtes non-GET ou les requêtes d'API
  if (event.request.method !== 'GET' || 
      event.request.url.includes('supabase.co') ||
      event.request.url.includes('cdn.gpteng.co') ||
      !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200) {
              return response;
            }
            
            // Mettre en cache uniquement les réponses valides
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              })
              .catch(console.error);

            return response;
          })
          .catch(() => {
            // Retourner une réponse d'erreur personnalisée si hors-ligne
            return new Response('Hors ligne - Contenu non disponible', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain',
              }),
            });
          });
      })
  );
});

// Gestion des notifications
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
