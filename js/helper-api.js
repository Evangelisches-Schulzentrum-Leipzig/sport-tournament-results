const hostKey = 'helperHost';
let host = localStorage.getItem(hostKey) || "http://localhost:8083";
const WS_URL = 'ws://localhost:8083/ws';

export function setHost(newHost) {
    host = newHost;
    localStorage.setItem(hostKey, newHost);
}

export function getHost() {
    return host;
}

// WebSocket helper: monitor connectivity and register after 2 successful checks
const HELPER_ID_KEY = 'helperId';
export const HELPER_NAME_KEY = 'helperName';

/**
 * 
 * @returns {Promise<boolean>}
 */
export async function checkConnectivity() {
    return fetch(`${host}/status`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'ok') {
                document.querySelector('#sync-icon').innerText = 'cloud_done';
                document.querySelector('#sync-icon').classList.remove('offline');
                return true;
            } else {
                throw new Error('Unexpected response');
            }
        })
        .catch(error => {
            document.querySelector('#sync-icon').innerText = 'cloud_off';
            document.querySelector('#sync-icon').classList.add('offline');
            return false;
        });
}

let wsConnection = null;
let consecutiveSuccesses = 0;
let connectivityTimer = null;

function connectWebSocket() {
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) return;
    try {
        wsConnection = new WebSocket(WS_URL);
    } catch (e) {
        console.error('Failed to create WebSocket:', e);
        wsConnection = null;
        return;
    }

    wsConnection.addEventListener('open', () => {
        heartbeat(wsConnection);
        console.log('Helper WebSocket connected');
        const name = localStorage.getItem(HELPER_NAME_KEY) || 'Helper';
        let registerMsg;
        if (localStorage.getItem(HELPER_ID_KEY)) {
            console.log('Already registered with id:', localStorage.getItem(HELPER_ID_KEY));
            registerMsg = { type: 'reregister', uuid: localStorage.getItem(HELPER_ID_KEY), name };
        } else {
            registerMsg = { type: 'register', name };
        }
        try {
            wsConnection.send(JSON.stringify(registerMsg));
        } catch (e) {
            console.error('Failed to send register message:', e);
        }
    });

    wsConnection.addEventListener('ping', () => {
        heartbeat(wsConnection);
    });

    wsConnection.addEventListener('message', (ev) => {
        try {
            const message = JSON.parse(ev.data);
            if (message.type === 'registered' && message.id) {
                try {
                    localStorage.setItem(HELPER_ID_KEY, message.id);
                } catch (e) {
                    console.error('Unable to persist helper id:', e);
                }
                console.log('Registered helper id:', message.id);
            } else if (message.type === 'clients' && message.helpers) {
                console.log('Clients list:', message.helpers);
                const el = document.querySelector('#live-client-list');
                if (el) el.textContent = JSON.stringify(message.helpers);
            } else {
                console.log('Unhandled WS message:', message);
            }
        } catch (e) {
            console.error('Error parsing WS message:', e);
        }
    });

    wsConnection.addEventListener('close', () => {
        if (wsConnection && wsConnection.pingTimeout) clearTimeout(wsConnection.pingTimeout);

        console.log('Helper WebSocket closed');
        wsConnection = null;
        consecutiveSuccesses = 0;
    });

    wsConnection.addEventListener('error', (err) => {
        console.error('WebSocket error:', err);
    });
}

function heartbeat(ws) {
    clearTimeout(ws.pingTimeout);
    ws.pingTimeout = setTimeout(() => {
        console.warn('WebSocket heartbeat failed, closing connection');
        ws.close();
    }, 30000 + 1000);
}


function startConnectivityMonitor() {
    if (connectivityTimer) return;
    connectivityTimer = setInterval(async () => {
        try {
            const ok = await checkConnectivity();
            if (ok) {
                consecutiveSuccesses++;
                if (consecutiveSuccesses >= 2) {
                    connectWebSocket();
                }
            } else {
                consecutiveSuccesses = 0;
                if (wsConnection) {
                    try { wsConnection.close(); } catch (e) {}
                    wsConnection = null;
                }
            }
        } catch (e) {
            console.error('Error during connectivity check:', e);
            consecutiveSuccesses = 0;
        }
    }, 3000);
}

startConnectivityMonitor();

window.addEventListener('beforeunload', () => {
    if (wsConnection) {
        try { wsConnection.close(); } catch (e) {}
    }
    if (connectivityTimer) clearInterval(connectivityTimer);
});

/**
 * 
 * @returns {Promise<{classes: {name: string, level: number}[], disciplines: {id: number, name: string, unit: string, attempts: number, timer: boolean}[], participants: {id: number, name: string, forename: string, class: string}[], measurements: {id: number, participant_id: number, discipline_id: number, attempt_number: number, value: number, created_at: string}[]} | null>}
 */
export async function getData() {
    if (await checkConnectivity()) {
        return fetch(`${host}/data`)
            .then(response => response.json())
            .catch(error => {
                console.error('Error fetching data:', error);
                return null;
            });
    } else {
        console.warn('Server is not reachable. Returning null.');
        return null;
    }
}

/**
 * 
 * @returns {Promise<{name: string, level: number}[] | null>}
 */
export async function getClasses() {
    if (await checkConnectivity()) {
        return fetch(`${host}/classes`)
            .then(response => response.json())
            .catch(error => {
                console.error('Error fetching classes:', error);
                return null;
            });
    } else {
        console.warn('Server is not reachable. Returning null.');
        return null;
    }
}

/**
 * 
 * @returns {Promise<{id: number, name: string, unit: string, attempts: number, timer: boolean}[] | null>}
 */
export async function getDisciplines() {
    if (await checkConnectivity()) {
        return fetch(`${host}/disciplines`)
            .then(response => response.json())
            .catch(error => {
                console.error('Error fetching disciplines:', error);
                return null;
            });
    } else {
        console.warn('Server is not reachable. Returning null.');
        return null;
    }
}

/**
 * 
 * @returns {Promise<{id: number, name: string, forename: string, class: string}[] | null>}
 */
export async function getParticipants() {
    if (await checkConnectivity()) {
        return fetch(`${host}/participants`)
            .then(response => response.json())
            .catch(error => {
                console.error('Error fetching participants:', error);
                return null;
            });
    } else {
        console.warn('Server is not reachable. Returning null.');
        return null;
    }
}

/**
 * 
 * @returns {Promise<{id: number, participant_id: number, discipline_id: number, attempt_number: number, value: number, created_at: string}[] | null>}
 */
export async function getMeasurements() {
    if (await checkConnectivity()) {
        return fetch(`${host}/measurements`)
            .then(response => response.json())
            .catch(error => {
                console.error('Error fetching measurements:', error);
                return null;
            });
    } else {
        console.warn('Server is not reachable. Returning null.');
        return null;
    }
}

/**
 * 
 * @param {{id: number, participantId: number, disciplineId: number, attemptNumber: number, value: number, created_at: string, sync_time: string}} measurements 
 * @returns {Promise<{classes: {name: string, level: number}[], disciplines: {id: number, name: string, unit: string, attempts: number, timer: boolean}[], participants: {id: number, name: string, forename: string, class: string}[], measurements: {id: number, participant_id: number, discipline_id: number, attempt_number: number, value: number, created_at: string}[]} | null>}
 */
export async function sync(measurements) {
    if (await checkConnectivity()) {
        return fetch(`${host}/sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(measurements)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .catch(error => {
            throw new Error('Error syncing data:', error);
        });
    } else {
        console.warn('Server is not reachable. Sync failed.');
        return null;
    }
}