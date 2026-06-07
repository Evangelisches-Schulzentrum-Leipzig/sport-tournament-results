const host = "http://localhost:8083";

/**
 * Internal helper — makes a single fetch call, returns parsed JSON or null on any failure.
 * Eliminates the prior double round-trip (checkConnectivity + actual request).
 * @param {string} method HTTP method
 * @param {string} path Path relative to host (e.g. '/classes')
 * @param {*} [body] Optional request body — will be JSON-serialised
 * @returns {Promise<*|null>}
 */
async function apiRequest(method, path, body) {
    const options = { method, headers: {} };
    if (body !== undefined) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }
    try {
        const response = await fetch(`${host}${path}`, options);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        return text.length > 0 ? JSON.parse(text) : null;
    } catch (error) {
        console.error(`API ${method} ${path} failed:`, error);
        return null;
    }
}

/** @returns {Promise<boolean>} */
export async function checkConnectivity() {
    try {
        const data = await fetch(`${host}/status`).then(r => r.json());
        return data?.status === 'ok';
    } catch {
        return false;
    }
}

/**
 * 
 * @param {*} searchParams 
 * @returns {{classes: {name: string, level: number}[], disciplines: {id: number, name: string, unit: string, attempts: number, timer: boolean}[], participants: {id: number, name: string, forename: string, gender: string, class: string}[], measurements: {id: number, participant_id: number, discipline_id: number, attempt_number: number, value: number, created_at: string}[], markRanges: {discipline_id: number, class_level: number, gender: string, mark: number, min_value: number}[]}}
 */
export function getData(searchParams = {}) {
    const qs = new URLSearchParams(searchParams).toString();
    return apiRequest('GET', qs ? `/data?${qs}` : '/data');
}

/**
 * 
 * @param {*} searchParams 
 * @returns {Promise<{name: string, level: number}[]>}
 */
export function getClasses(searchParams = {}) {
    const qs = new URLSearchParams(searchParams).toString();
    return apiRequest('GET', qs ? `/classes?${qs}` : '/classes');
}

/**
 * 
 * @param {{name: string, level: number}} classData
 * @returns {Promise<{name: string, level: number}[]>} Updated list of classes after creation
 */
export function createClass(classData) {
    return apiRequest('POST', '/classes', classData);
}

/**
 * 
 * @param {string} name 
 * @param {{name: string, level: number}} classData 
 * @returns {Promise<{name: string, level: number}[]>} Updated list of classes after update
 */
export function updateClass(name, classData) {
    return apiRequest('PATCH', `/classes/${encodeURIComponent(name)}`, classData);
}

/**
 * 
 * @param {string} name 
 * @returns {Promise<{name: string, level: number}[]>} Updated list of classes after deletion
 */
export function deleteClass(name) {
    return apiRequest('DELETE', `/classes/${encodeURIComponent(name)}`);
}

/**
 * 
 * @param {*} searchParams 
 * @returns {Promise<{id: number, name: string, unit: string, attempts: number, timer: boolean}[]>}
 */
export function getDisciplines(searchParams = {}) {
    const qs = new URLSearchParams(searchParams).toString();
    return apiRequest('GET', qs ? `/disciplines?${qs}` : '/disciplines');
}

/**
 * 
 * @param {{id: number, name: string, unit: string, attempts: number, timer: boolean}} disciplineData
 * @returns {Promise<{id: number, name: string, unit: string, attempts: number, timer: boolean}[]>} Updated list of disciplines after creation
 */
export function createDiscipline(disciplineData) {
    return apiRequest('POST', '/disciplines', disciplineData);
}

/**
 * 
 * @param {number} id 
 * @param {{id: number, name: string, unit: string, attempts: number, timer: boolean}} disciplineData 
 * @returns {Promise<{id: number, name: string, unit: string, attempts: number, timer: boolean}[]>} Updated list of disciplines after update
 */
export function updateDiscipline(id, disciplineData) {
    return apiRequest('PATCH', `/disciplines/${id}`, disciplineData);
}

/**
 * 
 * @param {number} id 
 * @returns {Promise<{id: number, name: string, unit: string, attempts: number, timer: boolean}[]>} Updated list of disciplines after deletion
 */
export function deleteDiscipline(id) {
    return apiRequest('DELETE', `/disciplines/${id}`);
}

/**
 * 
 * @param {*} searchParams 
 * @returns {Promise<{id: number, name: string, forename: string, gender: string, class: string}[]>}
 */
export function getParticipants(searchParams = {}) {
    const qs = new URLSearchParams(searchParams).toString();
    return apiRequest('GET', qs ? `/participants?${qs}` : '/participants');
}

/**
 * 
 * @param {{id: number, name: string, forename: string, gender: string, class: string}} participantData
 * @returns {Promise<{id: number, name: string, forename: string, gender: string, class: string}[]>} Updated list of participants after creation
 */
export function createParticipant(participantData) {
    return apiRequest('POST', '/participants', participantData);
}

export function updateParticipant(id, participantData) {
    return apiRequest('PATCH', `/participants/${id}`, participantData);
}

export function deleteParticipant(id) {
    return apiRequest('DELETE', `/participants/${id}`);
}

/**
 * 
 * @param {*} searchParams 
 * @returns {Promise<{id: number, participant_id: number, discipline_id: number, attempt_number: number, value: number, created_at: string}[]>}
 */
export function getMeasurements(searchParams = {}) {
    const qs = new URLSearchParams(searchParams).toString();
    return apiRequest('GET', qs ? `/measurements?${qs}` : '/measurements');
}

export function createMeasurement(measurementData) {
    return apiRequest('POST', '/measurements', measurementData);
}

export function deleteMeasurement(id) {
    return apiRequest('DELETE', `/measurements/${id}`);
}

/**
 * 
 * @param {*} searchParams 
 * @returns {Promise<{id: number, participant_id: number, discipline_id: number, attempt_number: number, value: number, created_at: string}[][]>}
 */
export function getMeasurementConflicts(searchParams = {}) {
    const qs = new URLSearchParams(searchParams).toString();
    return apiRequest('GET', qs ? `/measurements/conflicts?${qs}` : '/measurements/conflicts');
}

/**
 * 
 * @param {*} searchParams 
 * @returns {Promise<{discipline_id: number, class_level: number, gender: string, mark: number, min_value: number}[]>}
 */
export function getMarkRanges(searchParams = {}) {
    const qs = new URLSearchParams(searchParams).toString();
    return apiRequest('GET', qs ? `/mark-ranges?${qs}` : '/mark-ranges');
}

export function createMarkRange(markRangeData) {
    return apiRequest('POST', '/mark-ranges', markRangeData);
}

export function updateMarkRange(disciplineId, classLevel, gender, mark, markRangeData) {
    return apiRequest('PATCH', `/mark-ranges/${disciplineId}/${encodeURIComponent(classLevel)}/${encodeURIComponent(gender)}/${encodeURIComponent(mark)}`, markRangeData);
}

export function deleteMarkRange(disciplineId, classLevel, gender, mark) {
    return apiRequest('DELETE', `/mark-ranges/${disciplineId}/${encodeURIComponent(classLevel)}/${encodeURIComponent(gender)}/${encodeURIComponent(mark)}`);
}

/**
 * 
 * @param {{participant_id: number, discipline_id: number, attempt_number: number, value: number, sync_ws_uuid: string}[]} measurements Array of {participant_id: number, discipline_id: number, attempt_number: number, value: number}
 * @returns {{classes: {name: string, level: number}[], disciplines: {id: number, name: string, unit: string, attempts: number, timer: boolean}[], participants: {id: number, name: string, forename: string, gender: string, class: string}[], measurements: {id: number, participant_id: number, discipline_id: number, attempt_number: number, value: number, created_at: string}[], markRanges: {discipline_id: number, class_level: number, gender: string, mark: number, min_value: number}[]}}
 */
export function sync(measurements) {
    return apiRequest('POST', '/sync', measurements);
}

// WebSocket client for central dashboard to receive helper lists and updates
const WS_URL = 'ws://localhost:8083/ws';
let centralWs = null;
let centralReconnectTimer = null;
let centralOnClients = null;
let centralBackoff = 1000;

function handleCentralMessage(ev) {
    try {
        const message = JSON.parse(ev.data);
        if (message.type === 'clients' && centralOnClients) {
            centralOnClients(message.helpers || []);
        }
    } catch (e) {
        console.error('Error parsing central WS message:', e);
    }
}

function connectCentralWebSocket() {
    if (centralWs && centralWs.readyState === WebSocket.OPEN) return;
    try {
        centralWs = new WebSocket(WS_URL);
    } catch (e) {
        console.error('Central: failed to create WebSocket', e);
        scheduleCentralReconnect();
        return;
    }

    centralWs.addEventListener('open', () => {
        console.log('Central WebSocket connected');
        centralBackoff = 1000;
        try { centralWs.send(JSON.stringify({ type: 'request-clients' })); } catch (e) {}
    });

    centralWs.addEventListener('message', handleCentralMessage);

    centralWs.addEventListener('close', () => {
        console.log('Central WebSocket closed');
        centralWs = null;
        scheduleCentralReconnect();
    });

    centralWs.addEventListener('error', (err) => {
        console.error('Central WebSocket error', err);
    });
}

function scheduleCentralReconnect() {
    if (centralReconnectTimer) return;
    centralReconnectTimer = setTimeout(() => {
        centralReconnectTimer = null;
        connectCentralWebSocket();
        centralBackoff = Math.min(30000, centralBackoff * 1.5);
    }, centralBackoff);
}

export function startCentralWebSocket(onClients) {
    centralOnClients = onClients;
    connectCentralWebSocket();
}

export function stopCentralWebSocket() {
    if (centralWs) {
        try { centralWs.close(); } catch (e) {}
        centralWs = null;
    }
    if (centralReconnectTimer) {
        clearTimeout(centralReconnectTimer);
        centralReconnectTimer = null;
    }
}

export function centralRequestClients() {
    if (centralWs && centralWs.readyState === WebSocket.OPEN) {
        try { centralWs.send(JSON.stringify({ type: 'request-clients' })); } catch (e) {}
    }
}
