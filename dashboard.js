document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const API_BASE_URL = 'http://localhost:3000'; // IMPORTANT: Change if your backend is elsewhere
    const HEARTBEAT_INTERVAL_MS = 55 * 1000; // Send heartbeat every 55s to be safe

    // --- UI ELEMENTS ---
    const generateKeyBtn = document.getElementById('generate-key-btn');
    const requestKeyBtn = document.getElementById('request-key-btn');
    const workerPool = document.getElementById('worker-pool');
    const noWorkersMsg = document.getElementById('no-workers-msg');
    const apiLog = document.getElementById('api-log');
    const infoModal = document.getElementById('info-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modalContent = document.getElementById('modal-content');

    // --- STATE ---
    const activeWorkers = new Map(); // keyId -> { heartbeatIntervalId, element }

    // --- LOGGING UTILITY ---
    const logMessage = (level, message) => {
        const timestamp = new Date().toLocaleTimeString();
        const color = {
            'INFO': 'text-blue-400',
            'SUCCESS': 'text-green-400',
            'ERROR': 'text-red-400',
            'WARN': 'text-yellow-400',
        }[level];
        apiLog.innerHTML += `<span class="font-bold ${color}">[${level}] ${timestamp}:</span> ${message}\n`;
        apiLog.scrollTop = apiLog.scrollHeight; // Auto-scroll to bottom
    };

    // --- API HELPERS ---
    const apiFetch = async (endpoint, options = {}) => {
        const url = `${API_BASE_URL}${endpoint}`;
        logMessage('INFO', `Requesting ${options.method || 'GET'} ${url}`);
        try {
            const response = await fetch(url, {
                headers: { 'Content-Type': 'application/json' },
                ...options,
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
            logMessage('SUCCESS', `Response ${response.status} from ${url}: ${JSON.stringify(data)}`);
            return data;
        } catch (error) {
            logMessage('ERROR', `Failed fetch to ${url}: ${error.message}`);
            throw error;
        }
    };
    
    // --- CORE API FUNCTIONS ---
    const generateNewKey = () => apiFetch('/keys', { method: 'POST' });
    const getAvailableKey = () => apiFetch('/keys', { method: 'GET' });
    const getKeyInfo = (keyId) => apiFetch(`/keys/${keyId}`, { method: 'GET' });
    const deleteKey = (keyId) => apiFetch(`/keys/${keyId}`, { method: 'DELETE' });
    const unblockKey = (keyId) => apiFetch(`/keys/${keyId}`, { method: 'PUT' });
    const keepAlive = (keyId) => apiFetch(`/keys/${keyId}/keepalive`, { method: 'PUT' });

    // --- WORKER MANAGEMENT ---
    const addWorker = (keyId) => {
        if (noWorkersMsg) noWorkersMsg.remove();
        
        const workerId = `worker-${keyId}`;
        const workerElement = document.createElement('div');
        workerElement.id = workerId;
        workerElement.className = 'bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col space-y-4 animate-fade-in';
        
        // --- MODIFICATION START ---
        // Moved all Tailwind utility classes directly into the class attributes of the buttons
        workerElement.innerHTML = `
            <div>
                <p class="text-sm text-gray-400">Key ID</p>
                <p class="font-mono text-lg break-all">${keyId}</p>
            </div>
            <div class="w-full bg-gray-700 rounded-full h-2.5">
                <div class="bg-blue-500 h-2.5 rounded-full animate-pulse" style="width: 100%"></div>
            </div>
            <div class="grid grid-cols-2 gap-2 text-sm">
                <button data-action="unblock" class="px-4 py-2 rounded-md font-semibold shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-75 bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400 text-gray-800">Release</button>
                <button data-action="keepalive" class="px-4 py-2 rounded-md font-semibold text-white shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-75 bg-cyan-500 hover:bg-cyan-600 focus:ring-cyan-400">Keep Alive</button>
                <button data-action="delete" class="px-4 py-2 rounded-md font-semibold text-white shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-75 bg-red-600 hover:bg-red-700 focus:ring-red-500">Delete</button>
                <button data-action="info" class="px-4 py-2 rounded-md font-semibold text-white shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-opacity-75 bg-indigo-500 hover:bg-indigo-600 focus:ring-indigo-400">Get Info</button>
            </div>
        `;
        // --- MODIFICATION END ---
        workerPool.appendChild(workerElement);

        // Start heartbeat
        const heartbeatIntervalId = setInterval(() => {
            keepAlive(keyId).catch(err => {
                logMessage('ERROR', `Heartbeat failed for ${keyId}. It may be auto-unblocked soon.`);
                removeWorker(keyId); // Stop trying if key is gone
            });
        }, HEARTBEAT_INTERVAL_MS);

        activeWorkers.set(keyId, { heartbeatIntervalId, element: workerElement });

        // Add event listeners to worker buttons
        workerElement.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button) return;
            const action = button.dataset.action;
            
            switch (action) {
                case 'unblock':
                    unblockKey(keyId).then(() => removeWorker(keyId));
                    break;
                case 'delete':
                    deleteKey(keyId).then(() => removeWorker(keyId));
                    break;
                case 'info':
                    getKeyInfo(keyId).then(showKeyInfo);
                    break;
                case 'keepalive':
                    keepAlive(keyId); // Manually trigger a heartbeat
                    break;
            }
        });
    };

    const removeWorker = (keyId) => {
        const worker = activeWorkers.get(keyId);
        if (worker) {
            clearInterval(worker.heartbeatIntervalId);
            worker.element.remove();
            activeWorkers.delete(keyId);
            logMessage('INFO', `Worker for key ${keyId} removed.`);

            if (activeWorkers.size === 0 && !document.getElementById('no-workers-msg')) {
                workerPool.innerHTML = `<p id="no-workers-msg" class="text-gray-500 col-span-full">No active workers. Request a key to begin.</p>`;
            }
        }
    };
    
    const showKeyInfo = (keyData) => {
        modalContent.innerHTML = `
            <ul class="space-y-3">
                <li><span class="font-semibold text-gray-400">Blocked:</span> <span class="font-mono ${keyData.isBlocked ? 'text-red-400' : 'text-green-400'}">${keyData.isBlocked}</span></li>
                <li><span class="font-semibold text-gray-400">Blocked At:</span> <span class="font-mono">${keyData.blockedAt ? new Date(keyData.blockedAt).toLocaleString() : 'N/A'}</span></li>
                <li><span class="font-semibold text-gray-400">Created At:</span> <span class="font-mono">${new Date(keyData.createdAt).toLocaleString()}</span></li>
                <li><span class="font-semibold text-gray-400">Expires At:</span> <span class="font-mono">${new Date(keyData.expiresAt).toLocaleString()}</span></li>
            </ul>`;
        infoModal.classList.remove('hidden');
    };

    // --- EVENT LISTENERS ---
    generateKeyBtn.addEventListener('click', () => {
        generateKeyBtn.disabled = true;
        generateNewKey().finally(() => generateKeyBtn.disabled = false);
    });

    requestKeyBtn.addEventListener('click', () => {
        requestKeyBtn.disabled = true;
        getAvailableKey()
            .then(data => {
                if (data.keyId) {
                    addWorker(data.keyId);
                }
            })
            .finally(() => requestKeyBtn.disabled = false);
    });
    
    closeModalBtn.addEventListener('click', () => infoModal.classList.add('hidden'));
    infoModal.addEventListener('click', (e) => {
            if (e.target === infoModal) {
            infoModal.classList.add('hidden');
            }
    });

});
