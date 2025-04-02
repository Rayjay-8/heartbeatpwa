// Configuration
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const HEARTBEAT_ENDPOINT = process.env.WEBHOOK || 'https://api.example.com/heartbeat'; // Using environment variable WEBHOOK

// DOM Elements
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const lastHeartbeatElement = document.getElementById('lastHeartbeat');

// State
let isOnline = false;
let lastHeartbeatTime = null;

// Update UI based on connection status
function updateConnectionStatus(online) {
    isOnline = online;
    statusIndicator.className = `status-indicator ${online ? 'online' : 'offline'}`;
    statusText.textContent = online ? 'Connected' : 'Disconnected';
}

// Format timestamp for display
function formatTimestamp(timestamp) {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
}

// Listen for messages from service worker
navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data.type === 'heartbeat') {
        lastHeartbeatTime = new Date(event.data.timestamp);
        lastHeartbeatElement.textContent = `Last heartbeat: ${formatTimestamp(lastHeartbeatTime)}`;
        updateConnectionStatus(event.data.status === 'success');
    }
});

// Initialize the app
function initApp() {
    // Initial connection check
    updateConnectionStatus(navigator.onLine);

    // Set up event listeners for online/offline events
    window.addEventListener('online', () => updateConnectionStatus(true));
    window.addEventListener('offline', () => updateConnectionStatus(false));

    // Register for background sync if supported
    if ('serviceWorker' in navigator && 'sync' in window.registration) {
        navigator.serviceWorker.ready.then(registration => {
            registration.sync.register('heartbeat-sync');
        });
    }
}

// Start the app when the page loads
window.addEventListener('load', initApp);

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

        if (response.ok) {
            lastHeartbeatTime = Date.now();
            lastHeartbeatElement.textContent = `Last heartbeat: ${formatTimestamp(lastHeartbeatTime)}`;
            updateConnectionStatus(true);
        } else {
            throw new Error('Heartbeat failed');
        }
    } catch (error) {
        console.error('Heartbeat error:', error);
        updateConnectionStatus(false);
    }
}

// Initialize heartbeat mechanism
function initHeartbeat() {
    // Initial connection check
    updateConnectionStatus(navigator.onLine);

    // Set up event listeners for online/offline events
    window.addEventListener('online', () => updateConnectionStatus(true));
    window.addEventListener('offline', () => updateConnectionStatus(false));

    // Start heartbeat interval
    setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    // Send initial heartbeat
    sendHeartbeat();
}

// Start the heartbeat when the page loads
window.addEventListener('load', initHeartbeat);