// Configuration
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const HEARTBEAT_ENDPOINT = 'https://api.example.com/heartbeat'; // Replace with your actual endpoint

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