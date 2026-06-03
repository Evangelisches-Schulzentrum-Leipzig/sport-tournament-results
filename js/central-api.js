let host = "http://localhost:8083";

/**
 * Check if the API server is reachable and responding correctly.
 * @returns {Promise<boolean>} True if server is reachable and healthy, false otherwise
 */
export async function checkConnectivity() {
    return fetch(`${host}/status`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'ok') {
                return true;
            } else {
                throw new Error('Unexpected response');
            }
        })
        .catch(error => {
            return false;
        });
}

/**
 * Fetch all data from the server: classes, disciplines, participants, and measurements.
 * Supports filtering by search parameters.
 * @param {Object} [searchParams={}] Optional filter parameters
 * @returns {Promise<{classes: {name: string, level: number}[], disciplines: {id: number, name: string, unit: string, attempts: number, timer: boolean}[], participants: {id: number, name: string, forename: string, class: string}[], measurements: {id: number, participant_id: number, discipline_id: number, attempt_number: number, value: number, created_at: string}[], markRanges: {discipline_id: number, class_level: number, gender: string, mark: number, min_value: number}[]} | null>} Combined data object or null if request fails
 */
export async function getData(searchParams = {}) {
    if (await checkConnectivity()) {
        const queryString = new URLSearchParams(searchParams).toString();
        const url = queryString ? `${host}/data?${queryString}` : `${host}/data`;
        return fetch(url)
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
 * Fetch all classes with optional search filter.
 * @param {Object} [searchParams={}] Optional filter parameters (q for name search, level for filtering)
 * @returns {Promise<{name: string, level: number}[] | null>} Array of class objects or null if request fails
 */
export async function getClasses(searchParams = {}) {
    if (await checkConnectivity()) {
        const queryString = new URLSearchParams(searchParams).toString();
        const url = queryString ? `${host}/classes?${queryString}` : `${host}/classes`;
        return fetch(url)
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
 * Create a new class in the database.
 * @param {{name: string, level: number}} classData Class data to create
 * @returns {Promise<{name: string, level: number}[] | null>} Updated list of all classes or null if request fails
 */
export async function createClass(classData) {
    if (await checkConnectivity()) {
        return fetch(`${host}/classes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(classData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .catch(error => {
                console.error('Error creating class:', error);
                return null;
            });
    } else {
        console.warn('Server is not reachable. Create class failed.');
        return null;
    }
}

/**
 * Update an existing class by name.
 * @param {string} name Name of the class to update
 * @param {{level: number}} classData Updated class data
 * @returns {Promise<{name: string, level: number}[] | null>} Updated list of all classes or null if request fails
 */
export async function updateClass(name, classData) {
    if (await checkConnectivity()) {
        return fetch(`${host}/classes/${encodeURIComponent(name)}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(classData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .catch(error => {
                console.error('Error updating class:', error);
                return null;
            });
    } else {
        console.warn('Server is not reachable. Update class failed.');
        return null;
    }
}

/**
 * Delete a class by name.
 * @param {string} name Name of the class to delete
 * @returns {Promise<{name: string, level: number}[] | null>} Updated list of all classes or null if request fails
 */
export async function deleteClass(name) {
    if (await checkConnectivity()) {
        return fetch(`${host}/classes/${encodeURIComponent(name)}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .catch(error => {
                console.error('Error deleting class:', error);
                return null;
            });
    } else {
        console.warn('Server is not reachable. Delete class failed.');
        return null;
    }
}

/**
 * Fetch all disciplines with optional search filter.
 * @param {Object} [searchParams={}] Optional filter parameters (q for name search, unit for filtering)
 * @returns {Promise<{id: number, name: string, unit: string, attempts: number, timer: boolean}[] | null>} Array of discipline objects or null if request fails
 */
export async function getDisciplines(searchParams = {}) {
    if (await checkConnectivity()) {
        const queryString = new URLSearchParams(searchParams).toString();
        const url = queryString ? `${host}/disciplines?${queryString}` : `${host}/disciplines`;
        return fetch(url)
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
 * Create a new discipline in the database.
 * @param {{name: string, unit: string, attempts: number, timer: boolean}} disciplineData Discipline data to create
 * @returns {Promise<{id: number, name: string, unit: string, attempts: number, timer: boolean}[] | null>} Updated list of all disciplines or null if request fails
 */
export async function createDiscipline(disciplineData) {
    if (await checkConnectivity()) {
        return fetch(`${host}/disciplines`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(disciplineData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .catch(error => {
                console.error('Error creating discipline:', error);
                return null;
            });
    } else {
        console.warn('Server is not reachable. Create discipline failed.');
        return null;
    }
}

/**
 * Update an existing discipline by ID.
 * @param {number} id ID of the discipline to update
 * @param {{name: string, unit: string, attempts: number, timer: boolean}} disciplineData Updated discipline data
 * @returns {Promise<{id: number, name: string, unit: string, attempts: number, timer: boolean}[] | null>} Updated list of all disciplines or null if request fails
 */
export async function updateDiscipline(id, disciplineData) {
    if (await checkConnectivity()) {
        return fetch(`${host}/disciplines/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(disciplineData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .catch(error => {
                console.error('Error updating discipline:', error);
                return null;
            });
    } else {
        console.warn('Server is not reachable. Update discipline failed.');
        return null;
    }
}

/**
 * Delete a discipline by ID.
 * @param {number} id ID of the discipline to delete
 * @returns {Promise<{id: number, name: string, unit: string, attempts: number, timer: boolean}[] | null>} Updated list of all disciplines or null if request fails
 */
export async function deleteDiscipline(id) {
    if (await checkConnectivity()) {
        return fetch(`${host}/disciplines/${id}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .catch(error => {
                console.error('Error deleting discipline:', error);
                return null;
            });
    } else {
        console.warn('Server is not reachable. Delete discipline failed.');
        return null;
    }
}

/**
 * Fetch all participants with optional filters.
 * @param {Object} [searchParams={}] Optional filter parameters (class for class filter, q for name search)
 * @returns {Promise<{id: number, name: string, forename: string, gender: string, class: string}[] | null>} Array of participant objects or null if request fails
 */
export async function getParticipants(searchParams = {}) {
    if (await checkConnectivity()) {
        const queryString = new URLSearchParams(searchParams).toString();
        const url = queryString ? `${host}/participants?${queryString}` : `${host}/participants`;
        return fetch(url)
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
 * Create a new participant in the database.
 * @param {{name: string, forename: string, gender: string, class: string}} participantData Participant data to create
 * @returns {Promise<{id: number, name: string, forename: string, gender: string, class: string}[] | null>} Updated list of all participants or null if request fails
 */
export async function createParticipant(participantData) {
    if (await checkConnectivity()) {
        return fetch(`${host}/participants`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(participantData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .catch(error => {
                console.error('Error creating participant:', error);
                return null;
            });
    } else {
        console.warn('Server is not reachable. Create participant failed.');
        return null;
    }
}

/**
 * Update an existing participant by ID.
 * @param {number} id ID of the participant to update
 * @param {{name: string, forename: string, gender: string, class: string}} participantData Updated participant data
 * @returns {Promise<{id: number, name: string, forename: string, gender: string, class: string}[] | null>} Updated list of all participants or null if request fails
 */
export async function updateParticipant(id, participantData) {
    if (await checkConnectivity()) {
        return fetch(`${host}/participants/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(participantData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .catch(error => {
                console.error('Error updating participant:', error);
                return null;
            });
    } else {
        console.warn('Server is not reachable. Update participant failed.');
        return null;
    }
}

/**
 * Delete a participant by ID.
 * @param {number} id ID of the participant to delete
 * @returns {Promise<{id: number, name: string, forename: string, gender: string, class: string}[] | null>} Updated list of all participants or null if request fails
 */
export async function deleteParticipant(id) {
    if (await checkConnectivity()) {
        return fetch(`${host}/participants/${id}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .catch(error => {
                console.error('Error deleting participant:', error);
                return null;
            });
    } else {
        console.warn('Server is not reachable. Delete participant failed.');
        return null;
    }
}

/**
 * Fetch all measurements with optional filters.
 * @param {Object} [searchParams={}] Optional filter parameters (participant_id, discipline_id, attempt_number)
 * @returns {Promise<{id: number, participant_id: number, discipline_id: number, attempt_number: number, value: number, created_at: string}[] | null>} Array of measurement objects or null if request fails
 */
export async function getMeasurements(searchParams = {}) {
    if (await checkConnectivity()) {
        const queryString = new URLSearchParams(searchParams).toString();
        const url = queryString ? `${host}/measurements?${queryString}` : `${host}/measurements`;
        return fetch(url)
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
 * Create new measurement(s) in the database. Accepts a single measurement or an array of measurements.
 * @param {Array<{participant_id: number, discipline_id: number, attempt_number: number, value: number, created_at: string}> | {participant_id: number, discipline_id: number, attempt_number: number, value: number, created_at: string}} measurementData Single measurement or array of measurements to create
 * @returns {Promise<null>} Resolves when measurements are created or null if request fails
 */
export async function createMeasurement(measurementData) {
    if (await checkConnectivity()) {
        return fetch(`${host}/measurements`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(measurementData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
            })
            .catch(error => {
                console.error('Error creating measurement:', error);
                return null;
            });
    } else {
        console.warn('Server is not reachable. Create measurement failed.');
        return null;
    }
}

/**
 * Delete a measurement by ID.
 * @param {number} id ID of the measurement to delete
 * @returns {Promise<null>} Resolves when measurement is deleted or null if request fails
 */
export async function deleteMeasurement(id) {
    if (await checkConnectivity()) {
        return fetch(`${host}/measurements/${id}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
            })
            .catch(error => {
                console.error('Error deleting measurement:', error);
                return null;
            });
    } else {
        console.warn('Server is not reachable. Delete measurement failed.');
        return null;
    }
}

/**
 * Fetch measurement conflicts (measurements where the same participant has multiple values for the same discipline and attempt).
 * @param {Object} [searchParams={}] Optional filter parameters (participant_id, discipline_id)
 * @returns {Promise<{id: number, participant_id: number, discipline_id: number, attempt_number: number, value: number, created_at: string}[] | null>} Array of conflicting measurement objects or null if request fails
 */
export async function getMeasurementConflicts(searchParams = {}) {
    if (await checkConnectivity()) {
        const queryString = new URLSearchParams(searchParams).toString();
        const url = queryString ? `${host}/measurements/conflicts?${queryString}` : `${host}/measurements/conflicts`;
        return fetch(url)
            .then(response => response.json())
            .catch(error => {
                console.error('Error fetching measurement conflicts:', error);
                return null;
            });
    } else {
        console.warn('Server is not reachable. Returning null.');
        return null;
    }
}

/**
 * Fetch mark ranges with optional filters.
 * @param {Object} [searchParams={}] Optional filter parameters (discipline_id, class_level, gender, mark)
 * @returns {Promise<{discipline_id: number, class_level: number, gender: string, mark: string, min_value: number}[] | null>} Array of mark range objects or null if request fails
 */
export async function getMarkRanges(searchParams = {}) {
    if (await checkConnectivity()) {
        const queryString = new URLSearchParams(searchParams).toString();
        const url = queryString ? `${host}/mark-ranges?${queryString}` : `${host}/mark-ranges`;
        return fetch(url)
            .then(response => response.json())
            .catch(error => {
                console.error('Error fetching mark ranges:', error);
                return null;
            });
    } else {
        console.warn('Server is not reachable. Returning null.');
        return null;
    }
}

/**
 * Create a new mark range in the database.
 * @param {{discipline_id: number, class_level: number, gender: string, mark: string, min_value: number}} markRangeData Mark range data to create
 * @returns {Promise<null>} Resolves when mark range is created or null if request fails
 */
export async function createMarkRange(markRangeData) {
    if (await checkConnectivity()) {
        return fetch(`${host}/mark-ranges`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(markRangeData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
            })
            .catch(error => {
                console.error('Error creating mark range:', error);
                return null;
            });
    } else {
        console.warn('Server is not reachable. Create mark range failed.');
        return null;
    }
}

/**
 * Update an existing mark range.
 * @param {number} disciplineId ID of the discipline
 * @param {string} mark Mark grade to update
 * @param {{class_level: number, gender: string, min_value: number}} markRangeData Updated mark range data
 * @returns {Promise<null>} Resolves when mark range is updated or null if request fails
 */
export async function updateMarkRange(disciplineId, mark, markRangeData) {
    if (await checkConnectivity()) {
        return fetch(`${host}/mark-ranges/${disciplineId}/${encodeURIComponent(mark)}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(markRangeData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
            })
            .catch(error => {
                console.error('Error updating mark range:', error);
                return null;
            });
    } else {
        console.warn('Server is not reachable. Update mark range failed.');
        return null;
    }
}

/**
 * Delete a mark range by discipline ID and mark grade.
 * @param {number} disciplineId ID of the discipline
 * @param {string} mark Mark grade to delete
 * @returns {Promise<null>} Resolves when mark range is deleted or null if request fails
 */
export async function deleteMarkRange(disciplineId, mark) {
    if (await checkConnectivity()) {
        return fetch(`${host}/mark-ranges/${disciplineId}/${encodeURIComponent(mark)}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
            })
            .catch(error => {
                console.error('Error deleting mark range:', error);
                return null;
            });
    } else {
        console.warn('Server is not reachable. Delete mark range failed.');
        return null;
    }
}

/**
 * Sync measurements to the server and retrieve all synchronized data.
 * @param {Array<{participant_id: number, discipline_id: number, attempt_number: number, value: number, created_at: string}> | {participant_id: number, discipline_id: number, attempt_number: number, value: number, created_at: string}} measurements Single measurement or array of measurements to sync
 * @returns {Promise<{classes: {name: string, level: number}[], disciplines: {id: number, name: string, unit: string, attempts: number, timer: boolean}[], participants: {id: number, name: string, forename: string, class: string}[], measurements: {id: number, participant_id: number, discipline_id: number, attempt_number: number, value: number, created_at: string}[]} | null>} Synchronized data object containing all current data or null if request fails
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
                console.error('Error syncing data:', error);
                return null;
            });
    } else {
        console.warn('Server is not reachable. Sync failed.');
        return null;
    }
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
        // request current clients list
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