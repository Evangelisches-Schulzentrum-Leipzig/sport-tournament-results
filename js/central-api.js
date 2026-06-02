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
 * 
 * @returns {Promise<{name: string, level: number}[] | null>}
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
 * 
 * @param {{name: string, level: number}} classData
 * @returns {Promise<{name: string, level: number}[] | null>}
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
 * 
 * @param {string} name
 * @param {{level: number}} classData
 * @returns {Promise<{name: string, level: number}[] | null>}
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
 * 
 * @param {string} name
 * @returns {Promise<{name: string, level: number}[] | null>}
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
 * 
 * @returns {Promise<{id: number, name: string, unit: string, attempts: number, timer: boolean}[] | null>}
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
 * 
 * @param {{name: string, unit: string, attempts: number, timer: boolean}} disciplineData
 * @returns {Promise<{id: number, name: string, unit: string, attempts: number, timer: boolean}[] | null>}
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
 * 
 * @param {number} id
 * @param {{name: string, unit: string, attempts: number, timer: boolean}} disciplineData
 * @returns {Promise<{id: number, name: string, unit: string, attempts: number, timer: boolean}[] | null>}
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
 * 
 * @param {number} id
 * @returns {Promise<{id: number, name: string, unit: string, attempts: number, timer: boolean}[] | null>}
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
 * 
 * @returns {Promise<{id: number, name: string, forename: string, class: string}[] | null>}
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
 * 
 * @param {{name: string, forename: string, class: string}} participantData
 * @returns {Promise<{id: number, name: string, forename: string, class: string}[] | null>}
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
 * 
 * @param {number} id
 * @param {{name: string, forename: string, class: string}} participantData
 * @returns {Promise<{id: number, name: string, forename: string, class: string}[] | null>}
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
 * 
 * @param {number} id
 * @returns {Promise<{id: number, name: string, forename: string, class: string}[] | null>}
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
 * 
 * @returns {Promise<{id: number, participant_id: number, discipline_id: number, attempt_number: number, value: number, created_at: string}[] | null>}
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
 * 
 * @param {Array | {participant_id: number, discipline_id: number, attempt_number: number, value: number, created_at: string}} measurementData
 * @returns {Promise<null>}
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
 * 
 * @param {number} id
 * @returns {Promise<null>}
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
 * 
 * @returns {Promise<{id: number, participant_id: number, discipline_id: number, attempt_number: number, value: number, created_at: string}[] | null>}
 */
export async function getMeasurementConflicts(searchParams = {}) {
    if (await checkConnectivity()) {
        const queryString = new URLSearchParams(searchParams).toString();
        const url = queryString ? `${host}/measeurements/conflicts?${queryString}` : `${host}/measeurements/conflicts`;
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
 * 
 * @returns {Promise<{discipline_id: number, mark: string, min_value: number, max_value: number}[] | null>}
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
 * 
 * @param {{discipline_id: number, mark: string, min_value: number, max_value: number}} markRangeData
 * @returns {Promise<null>}
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
 * 
 * @param {number} disciplineId
 * @param {string} mark
 * @param {{min_value: number, max_value: number}} markRangeData
 * @returns {Promise<null>}
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
 * 
 * @param {number} disciplineId
 * @param {string} mark
 * @returns {Promise<null>}
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
 * 
 * @param {Array | {participant_id: number, discipline_id: number, attempt_number: number, value: number, created_at: string}} measurements
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
                console.error('Error syncing data:', error);
                return null;
            });
    } else {
        console.warn('Server is not reachable. Sync failed.');
        return null;
    }
}
