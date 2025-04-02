const CACHE_NAME = 'heartbeat-pwa-v1';
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const HEARTBEAT_ENDPOINT = 'https://api.example.com/heartbeat';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './app.js',
    './manifest.json',
    './icon-192x192.png',
    './icon-512x512.png'
];

// Install service worker and cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
});

// Activate service worker and clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Start background heartbeat after activation
    initBackgroundHeartbeat();
});

// Fetch event handler for network-first strategy
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .catch(() => {
                return caches.match(event.request);
            })
    );
});

// Background sync registration
self.addEventListener('sync', (event) => {
    if (event.tag === 'heartbeat-sync') {
        event.waitUntil(sendHeartbeat());
    }
});

// Send heartbeat to server
async function sendHeartbeat() {
    try {
        const response = await fetch(HEARTBEAT_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error('Heartbeat failed');
        }

        // Broadcast the successful heartbeat to all clients
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'heartbeat',
                status: 'success',
                timestamp: new Date().toISOString()
            });
        });
    } catch (error) {
        console.error('Background heartbeat error:', error);
        // Broadcast the failed heartbeat to all clients
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'heartbeat',
                status: 'error',
                timestamp: new Date().toISOString()
            });
        });
    }
}

// Initialize background heartbeat
function initBackgroundHeartbeat() {
    // Register periodic sync if supported
    if ('periodicSync' in self.registration) {
        const tryPeriodicSync = async () => {
            try {
                await self.registration.periodicSync.register('heartbeat-periodic', {
                    minInterval: HEARTBEAT_INTERVAL
                });
            } catch (error) {
                console.error('Periodic sync registration failed:', error);
            }
        };
        tryPeriodicSync();
    }

    // Fallback to regular interval if periodic sync is not supported
    setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
}

// Handle periodic sync events
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'heartbeat-periodic') {
        event.waitUntil(sendHeartbeat());
    }
});