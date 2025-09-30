const CACHE_NAME = 'eternal-veil-v1.0.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json',
    'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Inter:wght@300;400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap'
];

// Install event - cache resources
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Eternal Veil: Cache opened');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('Eternal Veil: Cache install failed:', error);
            })
    );
    // Force the waiting service worker to become the active service worker
    self.skipWaiting();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version or fetch from network
                if (response) {
                    return response;
                }

                // Clone the request because it's a stream
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(response => {
                    // Check if valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response because it's a stream
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                }).catch(error => {
                    console.error('Eternal Veil: Fetch failed:', error);
                    // Return offline page or fallback
                    if (event.request.destination === 'document') {
                        return caches.match('/');
                    }
                });
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Eternal Veil: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Ensure the service worker takes control immediately
    self.clients.claim();
});

// Background sync for offline message queue (future enhancement)
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        console.log('Eternal Veil: Background sync triggered');
        // Handle offline message queue
    }
});

// Push notifications (future enhancement)
self.addEventListener('push', event => {
    if (event.data) {
        const data = event.data.json();
        console.log('Eternal Veil: Push received:', data);

        // Show notification (respecting user privacy)
        self.registration.showNotification('Eternal Veil', {
            body: 'You have a new encrypted message',
            icon: '/icon-192.png',
            badge: '/badge-72.png',
            tag: 'eternal-veil-message',
            requireInteraction: false,
            silent: true
        });
    }
});

// Notification click handler
self.addEventListener('notificationclick', event => {
    event.notification.close();

    // Focus or open the app
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(clientList => {
            for (let client of clientList) {
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});

// Message handler for communication with main app
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});