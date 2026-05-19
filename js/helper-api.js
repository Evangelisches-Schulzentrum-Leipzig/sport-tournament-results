let host = "http://localhost:8083";

/**
 * 
 * @returns {Promise<boolean>}
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