/*
DB: helper-sports-tournament
Table classes(name:string PK NotNull, level:int NotNull Index)
Table participants(id:int PK NotNull AutoIncrement, name:string NotNull, forename:string NotNull, class_name:string NotNull Index)
Table disciplines(id:int PK NotNull AutoIncrement, name:string NotNull, unit:string NotNull, attempts:int NotNull default:2, timer:boolean NotNull default:false)
Table measurements(id:int PK NotNull AutoIncrement, participant_id:int NotNull Index, discipline_id:int NotNull Index, attempt_number:int NotNull, value:string NotNull, created_at:datetime NotNull default:current_timestamp, sync_time:datetime|null default:null)
*/

/** @type {IDBDatabase} */
let db;

/**
 * 
 * @returns {Promise<IDBOpenDBRequest>}
 */
export function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('helper-sports-tournament', 5);

        request.addEventListener('upgradeneeded', event => {
            console.log('Upgrading database...');
            db = event.target.result;
            ["classes", "participants", "disciplines", "measurements"].forEach(storeName => {
                if (db.objectStoreNames.contains(storeName)) {
                    db.deleteObjectStore(storeName);
                }
            });

            const classStore = db.createObjectStore('classes', { keyPath: 'name' });
            classStore.createIndex('level', 'level', { unique: false });

            const participantStore = db.createObjectStore('participants', { keyPath: 'id', autoIncrement: true });
            participantStore.createIndex('class_name', 'class_name', { unique: false });
            participantStore.createIndex('name', 'name', { unique: false });

            const disciplineStore = db.createObjectStore('disciplines', { keyPath: 'id', autoIncrement: true });
            disciplineStore.createIndex('name', 'name', { unique: false });

            const measurementStore = db.createObjectStore('measurements', { keyPath: 'id', autoIncrement: true });
            measurementStore.createIndex('participant_id', 'participant_id', { unique: false });
            measurementStore.createIndex('discipline_id', 'discipline_id', { unique: false });
            measurementStore.createIndex('sync_time', 'sync_time', { unique: false });
        });

        request.addEventListener('success', event => {
            db = event.target.result;
            console.log('Database opened successfully');
            resolve(request);
            db.addEventListener('error', event => {
                console.error('Database error:', event.target.error);
            });
            db.addEventListener('versionchange', () => {
                db.close();
                alert('A new version of the database is available. Please refresh the page.');
            });
            db.addEventListener('abort', event => {
                console.error('Database transaction aborted:', event.target.error);
            });
            db.addEventListener('close', () => {
                console.log('Database connection closed');
            });
        });

        request.addEventListener('error', event => {
            console.error('Error opening database:', event.target.error);
            reject(event.target.error);
        });
    });
}

/**
 * 
 * @param {string} name 
 * @param {number} level 
 * @returns {Promise<void>}
 */
export function addClassOrUpdate(name, level) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('classes', 'readwrite');
        const store = transaction.objectStore('classes');
        const request = store.put({ name, level });

        request.addEventListener('success', () => resolve());
        request.addEventListener('error', event => reject(event.target.error));
    });
}

/**
 * 
 * @param {string} name 
 * @param {string} forename 
 * @param {string} class_name 
 * @returns {Promise<void>}
 */
export function addParticipantOrUpdate(name, forename, class_name) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('participants', 'readwrite');
        const store = transaction.objectStore('participants');
        const index = store.index('name');
        const request = index.getAll(name);

        request.addEventListener('success', event => {
            const existingParticipants = event.target.result;
            const existingParticipant = existingParticipants.find(p => p.forename === forename && p.class_name === class_name);
            if (existingParticipant) {
                resolve();
                return;
            }
            const request = store.put({ name, forename, class_name });

            request.addEventListener('success', () => resolve());
            request.addEventListener('error', event => reject(event.target.error));
        });
        request.addEventListener('error', event => reject(event.target.error));
    });
}

/**
 * 
 * @param {string} name 
 * @param {string} unit 
 * @param {number} attempts 
 * @param {boolean} timer 
 * @returns {Promise<void>}
 */
export function addDisciplineOrUpdate(name, unit, attempts = 2, timer = false) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('disciplines', 'readwrite');
        const store = transaction.objectStore('disciplines');
        const index = store.index('name');
        const request = index.getAll(name);
        request.addEventListener('success', event => {
            const existingDisciplines = event.target.result;
            const existingDiscipline = existingDisciplines.find(d => d.unit === unit && d.attempts === attempts && d.timer === timer);
            if (existingDiscipline) {
                resolve();
                return;
            }
            const request = store.put({ name, unit, attempts, timer });

            request.addEventListener('success', () => resolve());
            request.addEventListener('error', event => reject(event.target.error));
        });
        request.addEventListener('error', event => reject(event.target.error));
    });
}

/**
 * 
 * @param {number} participant_id 
 * @param {number} discipline_id 
 * @param {number} attempt_number 
 * @param {number} value 
 * @param {Date} created_at
 * @param {Date|null} sync_time
 * @returns {Promise<void>}
 */
export function addMeasurementOrUpdate(participant_id, discipline_id, attempt_number, value, created_at = new Date().toISOString(), sync_time = null) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('measurements', 'readwrite');
        const store = transaction.objectStore('measurements');
        const index = store.index('participant_id');
        const request = index.getAll(participant_id);

        request.addEventListener('success', event => {
            const existingMeasurements = event.target.result;
            const existingMeasurement = existingMeasurements.find(m => m.discipline_id === discipline_id && m.attempt_number === attempt_number);
            let requestUpdate;
            if (existingMeasurement && new Date(existingMeasurement.created_at) < new Date(created_at)) {
                requestUpdate = store.put({ id: existingMeasurement.id, participant_id, discipline_id, attempt_number, value, created_at, sync_time });
            } else {
                requestUpdate = store.put({ participant_id, discipline_id, attempt_number, value, created_at, sync_time });
            }

            requestUpdate.addEventListener('success', () => resolve());
            requestUpdate.addEventListener('error', event => reject(event.target.error));
        });
        request.addEventListener('error', event => reject(event.target.error));
    });
}

/**
 * 
 * @param {number} measurementId 
 * @param {Date} syncTime 
 * @returns {Promise<void>}
 */
export function setSyncTime(measurementId, syncTime) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('measurements', 'readwrite');
        const store = transaction.objectStore('measurements');
        const request = store.get(measurementId);

        request.addEventListener('success', event => {
            const measurement = event.target.result;
            if (!measurement) {
                reject(new Error('Measurement not found'));
                return;
            }
            measurement.sync_time = syncTime.toISOString();
            const updateRequest = store.put(measurement);

            updateRequest.addEventListener('success', () => resolve());
            updateRequest.addEventListener('error', event => reject(event.target.error));
        });
        request.addEventListener('error', event => reject(event.target.error));
    });
}

/**
 * 
 * @returns {Promise<{name: string, level: number}[]>}
 */
export function getClasses() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('classes', 'readonly');
        const store = transaction.objectStore('classes');
        const request = store.getAll();

        request.addEventListener('success', event => resolve(event.target.result));
        request.addEventListener('error', event => reject(event.target.error));
    });
}

/**
 * 
 * @param {string|null} classId 
 * @returns {Promise<{id: number, name: string, forename: string, class_name: string}[]>}
 */
export function getParticipants(classId = null) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('participants', 'readonly');
        const store = transaction.objectStore('participants');
        let request;
        if (classId) {
            const index = store.index('class_name');
            request = index.getAll(classId);
        } else {
            request = store.getAll();
        }

        request.addEventListener('success', event => resolve(event.target.result));
        request.addEventListener('error', event => reject(event.target.error));
    });
}

/**
 * 
 * @returns {Promise<{id: number, name: string, unit: string, attempts: number, timer: boolean}[]>}
 */
export function getDisciplines() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('disciplines', 'readonly');
        const store = transaction.objectStore('disciplines');
        const request = store.getAll();

        request.addEventListener('success', event => resolve(event.target.result));
        request.addEventListener('error', event => reject(event.target.error));
    });
}

/**
 * 
 * @param {number} id 
 * @returns {Promise<{id: number, name: string, unit: string, attempts: number, timer: boolean}>}
 */
export function getDisciplineById(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('disciplines', 'readonly');
        const store = transaction.objectStore('disciplines');
        const request = store.get(id);

        request.addEventListener('success', event => resolve(event.target.result));
        request.addEventListener('error', event => reject(event.target.error));
    });
}

/**
 * 
 * @param {number} participant_id 
 * @param {number} discipline_id 
 * @returns {Promise<{id: number, participant_id: number, discipline_id: number, attempt_number: number, value: string, created_at: string, sync_time: string|null}[]>}
 */
export function getMeasurements(participant_id, discipline_id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('measurements', 'readonly');
        const store = transaction.objectStore('measurements');
        const index = store.index('participant_id');
        const request = index.getAll(participant_id);

        request.addEventListener('success', event => {
            const measurements = event.target.result.filter(m => m.discipline_id === discipline_id);
            resolve(measurements);
        });
        request.addEventListener('error', event => reject(event.target.error));
    });
}

/**
 * 
 * @param {string} class_name 
 * @param {number} discipline_id 
 * @returns {Promise<{id: number, participant_id: number, discipline_id: number, attempt_number: number, value: string, created_at: string, sync_time: string|null}[]>}
 */
export function getClassMeasurements(class_name, discipline_id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['participants', 'measurements'], 'readonly');
        const participantStore = transaction.objectStore('participants');
        const measurementStore = transaction.objectStore('measurements');

        const participantIndex = participantStore.index('class_name');
        const participantRequest = participantIndex.getAll(class_name);

        participantRequest.addEventListener('success', event => {
            const participants = event.target.result;
            const measurements = [];

            let processedParticipants = 0;
            participants.forEach(participant => {
                const measurementIndex = measurementStore.index('participant_id');
                const measurementRequest = measurementIndex.getAll(participant.id);

                measurementRequest.addEventListener('success', event => {
                    const participantMeasurements = event.target.result.filter(m => m.discipline_id === discipline_id);
                    measurements.push(...participantMeasurements);
                    processedParticipants++;
                    if (processedParticipants === participants.length) {
                        resolve(measurements);
                    }
                });
                measurementRequest.addEventListener('error', event => reject(event.target.error));
            });
        });
        participantRequest.addEventListener('error', event => reject(event.target.error));
    });
}

/**
 * 
 * @returns {Promise<{id: number, participant_id: number, discipline_id: number, attempt_number: number, value: string, created_at: string, sync_time: string|null}[]>}
 */
export function getSyncMeasurements() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('measurements', 'readonly');
        const store = transaction.objectStore('measurements');
        const request = store.getAll();

        request.addEventListener('success', event => resolve(event.target.result.filter(m => m.sync_time === null)));
        request.addEventListener('error', event => reject(event.target.error));
    });
}

/**
 * 
 * @returns {Promise<{id: number, participant_id: number, discipline_id: number, attempt_number: number, value: string, created_at: string, sync_time: string|null}[]>}
 */
export function getSyncedMeasurements() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('measurements', 'readonly');
        const store = transaction.objectStore('measurements');
        const request = store.getAll();

        request.addEventListener('success', event => resolve(event.target.result.filter(m => m.sync_time !== null)));
        request.addEventListener('error', event => reject(event.target.error));
    });
}