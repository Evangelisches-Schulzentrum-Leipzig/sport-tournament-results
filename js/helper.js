import { setHost, getHost, getData, sync, checkConnectivity, HELPER_NAME_KEY, wsUpdateSelectedClassAndDiscipline } from "./helper-api.js";
import { addClassOrUpdate, addDisciplineOrUpdate, addParticipantOrUpdate, addMeasurementOrUpdate, openDatabase, deleteDatabase, getDisciplines, getClasses, getDisciplineById, getParticipants, getClassMeasurements, getSyncMeasurements, getSyncedMeasurements, setSyncTime } from "./helper-db.js"
import { convertFloatToUnit, convertUnitToFloat } from "./utils.js"

const darkModeKey = 'darkModeEnabled';
const autoSyncKey = 'autoSyncEnabled';
const timerKeys = 'timerValues';

let lastSyncedTime = null;

// --- Timer state (cleared on every table redraw) ---
let _globalTimerInterval = null;
const _individualTimerIntervals = {};

function _clearAllTimerIntervals() {
    if (_globalTimerInterval) { clearInterval(_globalTimerInterval); _globalTimerInterval = null; }
    Object.keys(_individualTimerIntervals).forEach(k => { clearInterval(_individualTimerIntervals[k]); delete _individualTimerIntervals[k]; });
}

function _getTimerState() {
    try { return JSON.parse(localStorage.getItem(timerKeys)) || {}; } catch (e) { return {}; }
}

function _saveTimerState(state) {
    const hasData = state.global || (state.stoppedAt && Object.keys(state.stoppedAt).length) || (state.individual && Object.keys(state.individual).length);
    if (!hasData) { localStorage.removeItem(timerKeys); } else { localStorage.setItem(timerKeys, JSON.stringify(state)); }
}

function _fmtMs(ms) {
    const s = Math.floor(Math.max(0, ms) / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

// Returns the first empty attempt input in a row, or the last if all are filled
function _targetAttemptInput(tr) {
    const inputs = Array.from(tr.querySelectorAll('input[data-attempt]'));
    return inputs.find(i => !i.value.trim()) || inputs[inputs.length - 1] || null;
}

if (localStorage.getItem(autoSyncKey) === null) {
    localStorage.setItem(autoSyncKey, "true");
}

function updateDarkMode() {
    if (localStorage.getItem(darkModeKey) === null) {
        localStorage.setItem(darkModeKey, 'true');
    }
    const darkModeEnabled = localStorage.getItem(darkModeKey) === 'true';
    document.documentElement.classList.toggle("dark", darkModeEnabled);
}

function promptForHelperName() {
    try {
        const existing = localStorage.getItem(HELPER_NAME_KEY);
        document.querySelector("dialog#settings-dialog #helper-name-input").value = (existing && existing.trim()) ? existing.trim() : '';
        if (existing && existing.trim()) return;
        while (true) {
            const input = prompt('Bitte geben Sie Ihren Namen ein:');
            if (input === null) break; // user cancelled
            const name = input.trim();
            if (name) {
                document.querySelector("dialog#settings-dialog #helper-name-input").value = name;
                localStorage.setItem(HELPER_NAME_KEY, name);
                break;
            }
            alert('Name darf nicht leer sein.');
        }
    } catch (e) {
        console.error('Unable to access localStorage for helper name:', e);
    }
}

updateDarkMode();
promptForHelperName();

openDatabase().then(async request => {
    const data = await getData();
    if (data) {
        const { classes, disciplines, participants, measurements } = data;
        await Promise.all([
            ...classes.map(cls => addClassOrUpdate(cls.name, cls.level)),
            ...disciplines.map(discipline => addDisciplineOrUpdate(discipline.name, discipline.unit, discipline.attempts, discipline.timer, discipline.id)),
            ...participants.map(participant => addParticipantOrUpdate(participant.name, participant.forename, participant.class, participant.gender, participant.id)),
            ...measurements.map(measurement => addMeasurementOrUpdate(measurement.participant_id, measurement.discipline_id, measurement.attempt_number, measurement.value, measurement.id, measurement.created_at, new Date()))
        ])
    }
    updateSelectOptions();
    updateDataInputTable();
    displaySyncState();
})

function updateSelectOptions() {
    const disciplineSelect = document.querySelector('#discipline-select');
    const classSelect = document.querySelector('#class-select');

    const lastSelectedDiscipline = disciplineSelect.value;
    const lastSelectedClass = classSelect.value;
    
    // Clear existing options
    let htmlDiscipline = '<option value="" disabled selected>Sportart auswählen</option>';
    let htmlClass = '<option value="" disabled selected>Klasse auswählen</option>';

    getClasses().then(classes => {
        var groups = {};
        classes.forEach(cls => {
            if (!groups[cls.level]) {
                groups[cls.level] = [];
            }
            groups[cls.level].push(cls);
        });
        Object.keys(groups).forEach(level => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = level;
            groups[level].forEach(cls => {
                const option = document.createElement('option');
                option.value = cls.name;
                option.textContent = cls.name;
                optgroup.appendChild(option);
            });
            htmlClass += optgroup.outerHTML;
        });
        classSelect.innerHTML = htmlClass;
        if (lastSelectedClass && classes.some(c => c.name == lastSelectedClass)) {
            classSelect.value = lastSelectedClass;
        }
    }).catch(error => {
        console.error("Error fetching classes:", error);
    });

    getDisciplines().then(disciplines => {
        disciplines.forEach(discipline => {
            const option = document.createElement('option');
            option.value = discipline.id;
            option.textContent = discipline.name;
            htmlDiscipline += option.outerHTML;
        });
        disciplineSelect.innerHTML = htmlDiscipline;
        if (lastSelectedDiscipline && disciplines.some(d => d.id == lastSelectedDiscipline)) {
            disciplineSelect.value = lastSelectedDiscipline;
        }
    }).catch(error => {
        console.error("Error fetching disciplines:", error);
    });

    disciplineSelect.removeEventListener('change', updateDataInputTable);
    classSelect.removeEventListener('change', updateDataInputTable);
    disciplineSelect.addEventListener('change', () => {
        wsUpdateSelectedClassAndDiscipline(classSelect.value, disciplineSelect.value);
        updateDataInputTable();
    });
    classSelect.addEventListener('change', () => {
        wsUpdateSelectedClassAndDiscipline(classSelect.value, disciplineSelect.value);
        updateDataInputTable();
    });
}

async function updateDataInputTable() {
    const disciplineSelect = document.querySelector('#discipline-select');
    const classSelect = document.querySelector('#class-select');
    const disciplineId = parseInt(disciplineSelect.value);
    const className = classSelect.value;
    const tbody = document.querySelector('#data-input-con tbody');
    const thead = document.querySelector('#data-input-con thead');

    const lastInput = document.activeElement;

    if (isNaN(disciplineId) || !className) {
        thead.innerHTML = '<tr></tr>';
        tbody.innerHTML = '<tr><td style="text-align: center;">Bitte wählen Sie eine Sportart und eine Klasse aus.</td></tr>';
        return;
    }

    const discipline = await getDisciplineById(disciplineId);
    console.log("Selected discipline:", discipline);
    const participants = (await getParticipants(className)).sort((a, b) => a.name.localeCompare(b.name) || a.forename.localeCompare(b.forename));
    console.log("Participants in class:", participants);

    if (discipline === null || discipline === undefined) {
        thead.innerHTML = '<tr></tr>';
        tbody.innerHTML = '<tr><td style="text-align: center;">Keine Daten für die ausgewählte Sportart verfügbar.</td></tr>';
        return;
    }
    console.log("Participants:", participants.length);
    if (participants.length === 0) {
        thead.innerHTML = '<tr></tr>';
        tbody.innerHTML = '<tr><td style="text-align: center;">Keine Teilnehmende in der ausgewählten Klasse verfügbar.</td></tr>';
        return;
    }

    const measurements = await getClassMeasurements(className, disciplineId);
    console.log("Measurements for class and discipline:", measurements);

    switch (discipline.unit) {
        case 'minutes':
            var unitLabel = '(MM:SS)';
            break;
        case 'meters':
            var unitLabel = '(m)';
            break;
        default:
            var unitLabel = `(${discipline.unit})`;
    }
    var inputHtml = [];
    for (let index = 0; index < discipline.attempts; index++) {
        inputHtml.push(`<td><input type="text" inputmode="decimal" data-unit="${discipline.unit}" data-attempt="${index + 1}" data-discipline="${disciplineId}" data-participant="$participant$" value="$measurement$" id="input-${disciplineId}-${index + 1}-$participant$"></td>`);
    }

    thead.innerHTML = `
        <tr${discipline.timer ? ' class="has-timer"' : ''}>
            <th>ID</th>
            <th>Vorname</th>
            <th>Name</th>
            ${Array.from({ length: discipline.attempts }, (_, i) => `<th>Versuch ${i + 1} ${discipline.unit ? `${unitLabel}` : ''}</th>`).join('')}
            ${discipline.timer ? `<th><span id="time-value"></span><button id="stop-global-timer" style="display:none;"><span class="material-icons-round">stop</span></button><button id="start-global-timer"><span class="material-icons-round">timer</span> Timer</button></th>` : ''}
        </tr>
    `;
    var tbodyContent = '';

    for (const participant of participants) {
        const participantMeasurements = measurements.filter(m => m.participant_id === participant.id).sort((a, b) => a.attempt_number - b.attempt_number);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${participant.id}</td>
            <td>${participant.forename}</td>
            <td>${participant.name}</td>
            ${inputHtml.map((html, index) => {
                const measurement = participantMeasurements.find(m => m.attempt_number === index + 1);
                return html.replaceAll('$measurement$', measurement ? convertFloatToUnit(measurement.value, discipline.unit) : '').replaceAll('$participant$', participant.id);
            }).join('')}
            ${discipline.timer ? `<td><span id="time-value-${participant.id}"></span><button class="stop-timer" style="display:none;"><span class="material-icons-round">stop</span></button><button class="individual-timer"><span class="material-icons-round">timer</span></button></td>` : ''}
        `;
        tbodyContent += tr.outerHTML;
    }
    _clearAllTimerIntervals();
    tbody.innerHTML = tbodyContent;

    // Refocus last active input if still present
    if (lastInput) {
        var lastAttempt = lastInput.dataset.attempt;
        var lastDiscipline = lastInput.dataset.discipline;
        var lastParticipant = lastInput.dataset.participant;
        if (lastAttempt && lastDiscipline && lastParticipant) {
            const newInput = tbody.querySelector(`input[data-attempt="${lastAttempt}"][data-discipline="${lastDiscipline}"][data-participant="${lastParticipant}"]`);
            if (newInput) {
                newInput.focus();
                if (newInput.value) {
                    newInput.select();
                }
            }
        }
    }

    document.querySelectorAll('div#data-input-con tbody tr *:not(input):not(button)').forEach(element => 
        element.addEventListener('click', event => {
            if (event.target.tagName === 'INPUT') return;
            if (event.target.tagName === 'BUTTON' || event.target.closest('button')) return;
            const tr = event.target.closest('tr');
            const inputs = tr.querySelectorAll('input');
            const emptyInput = Array.from(inputs).find(input => !input.value);
            const targetInput = emptyInput || inputs[inputs.length - 1];
            targetInput.focus();
        })
    );

    // on click on data input select the value for a replacement
    document.querySelectorAll('div#data-input-con tbody tr input').forEach(input => 
        input.addEventListener('click', event => {
            const value = event.target.value;
            if (value) {
                event.target.select();
            }
        })
    );

    // enforce correct input format
    document.querySelectorAll('#data-input-con input').forEach(input => {
        input.addEventListener('input', event => {
            const value = event.target.value;
            const unit = event.target.dataset.unit;
            if (unit === 'minutes') {
                // allow only digits and colon, and enforce MM:SS format
                const cleanedValue = value.replace(/[^0-9:]/g, '');
                const parts = cleanedValue.split(':');
                parts[0] = parts[0] == '' ? '00' : parts[0]; // default minutes to 0 if empty
                if (parts.length > 2) {
                    event.target.value = parts.slice(0, 2).join(':');
                } else if (parts.length === 2) {
                    const minutes = parts[0]; // allow any number of digits for minutes
                    const seconds = parts[1].slice(0, 2); // limit seconds to 2 digits
                    event.target.value = `${minutes}:${seconds}`;
                } else {
                    event.target.value = cleanedValue; // allow any number of digits for minutes until colon is added 
                }
            } else if (unit === 'meters') {
                // allow only digits and optionally one decimal point
                const cleanedValue = value.replace(/[^0-9,.]/g, '');
                const parts = cleanedValue.split(/[,\.]/);
                if (parts.length > 2) {
                    event.target.value = parts.slice(0, 2).join(',');
                } else if (parts.length === 2) {
                    const integerPart = parts[0]; // allow any number of digits for integer part
                    const decimalPart = parts[1].slice(0, 2); // limit decimal part to 2 digits
                    event.target.value = `${integerPart},${decimalPart}`;
                } else {
                    event.target.value = cleanedValue; // allow only digits until decimal point is added
                }
            }
        });
    });

    // save value on input
    document.querySelectorAll('#data-input-con input').forEach(input => {
        input.addEventListener('input', event => {
            const value = event.target.value;
            if (!value) {
                return;
            }
            const attempt = parseInt(event.target.dataset.attempt);
            const discipline = parseInt(event.target.dataset.discipline);
            const participant = parseInt(event.target.dataset.participant);
            const unit = event.target.dataset.unit;

            addMeasurementOrUpdate(participant, discipline, attempt, convertUnitToFloat(value, unit)).then(() => {
                console.log("Measurement added or updated successfully");
                displaySyncState();
            }).catch(error => {
                console.error("Error adding or updating measurement:", error);
            });
        });
    });

    setupTimers(participants, disciplineId);
}

// localStorage shape: { global: <ms>, stoppedAt: { <pid>: <elapsedMs> }, individual: { <pid>: <startMs> } }
function setupTimers(participants, disciplineId) {
    _clearAllTimerIntervals();
    const state = _getTimerState();
    const startGlobalBtn = document.querySelector('#start-global-timer');
    const stopGlobalBtn  = document.querySelector('#stop-global-timer');
    const globalTimeEl   = document.querySelector('thead #time-value');
    if (!startGlobalBtn) return; // discipline has no timer

    // Always wire the start button regardless of which branch we enter,
    // so it works correctly after a global reset on a page that loaded mid-run.
    startGlobalBtn.onclick = () => {
        const s = _getTimerState();
        s.global = Date.now(); s.stoppedAt = {};
        _saveTimerState(s);
        setupTimers(participants, disciplineId);
    };

    if (state.global) {
        // ---- Global timer is running ----
        startGlobalBtn.style.display = 'none';
        stopGlobalBtn.style.display  = '';

        // Reset/stop: wipe state then re-run setupTimers to restore all button handlers cleanly
        stopGlobalBtn.onclick = () => {
            const s = _getTimerState();
            delete s.global; delete s.stoppedAt;
            _saveTimerState(s);
            _clearAllTimerIntervals();
            setupTimers(participants, disciplineId);
        };

        // Interval updates header + all non-stopped participant displays
        const tick = () => {
            const s = _getTimerState();
            if (!s.global) return;
            const elapsed = Date.now() - s.global;
            if (globalTimeEl) globalTimeEl.textContent = _fmtMs(elapsed);
            participants.forEach(p => {
                if (s.stoppedAt?.[p.id] !== undefined) return;
                const el = document.querySelector(`#time-value-${p.id}`);
                if (el) el.textContent = _fmtMs(elapsed);
            });
        };
        tick();
        _globalTimerInterval = setInterval(tick, 1000);

        // Per-participant stop buttons
        participants.forEach(participant => {
            const pid    = participant.id;
            const timeEl = document.querySelector(`#time-value-${pid}`);
            const tr     = timeEl?.closest('tr');
            if (!tr) return;
            const stopBtn  = tr.querySelector('button.stop-timer');
            const startBtn = tr.querySelector('button.individual-timer');
            if (startBtn) startBtn.style.display = 'none'; // hide individual start while global runs

            if (state.stoppedAt?.[pid] !== undefined) {
                // Already stopped individually — show frozen time, hide stop button
                if (timeEl)  timeEl.textContent    = _fmtMs(state.stoppedAt[pid]);
                if (stopBtn) stopBtn.style.display  = 'none';
            } else {
                // Still ticking with global
                if (stopBtn) {
                    stopBtn.style.display = '';
                    stopBtn.onclick = () => {
                        const s = _getTimerState();
                        if (!s.global) return;
                        const elapsedMs = Date.now() - s.global;
                        if (!s.stoppedAt) s.stoppedAt = {};
                        s.stoppedAt[pid] = elapsedMs;
                        _saveTimerState(s);
                        if (stopBtn) stopBtn.style.display = 'none';
                        if (timeEl)  timeEl.textContent    = _fmtMs(elapsedMs);
                        const input = _targetAttemptInput(tr);
                        if (input) {
                            addMeasurementOrUpdate(pid, disciplineId, parseInt(input.dataset.attempt), convertUnitToFloat(_fmtMs(elapsedMs), 'minutes'))
                                .then(() => { displaySyncState(); updateDataInputTable(); })
                                .catch(e => console.error('Global-timer save error:', e));
                        }
                    };
                }
            }
        });

    } else {
        // ---- No global timer ----
        startGlobalBtn.style.display = '';
        stopGlobalBtn.style.display  = 'none';
        if (globalTimeEl) globalTimeEl.textContent = '';

        // Individual per-participant timers
        participants.forEach(participant => {
            const pid    = participant.id;
            const timeEl = document.querySelector(`#time-value-${pid}`);
            const tr     = timeEl?.closest('tr');
            if (!tr) return;
            const stopBtn  = tr.querySelector('button.stop-timer');
            const startBtn = tr.querySelector('button.individual-timer');
            const indivStart = state.individual?.[pid];

            if (indivStart) {
                // Restore running individual timer
                if (startBtn) startBtn.style.display = 'none';
                if (stopBtn)  stopBtn.style.display  = '';
                const update = () => { if (timeEl) timeEl.textContent = _fmtMs(Date.now() - indivStart); };
                update();
                _individualTimerIntervals[pid] = setInterval(update, 1000);
                if (stopBtn) stopBtn.onclick = () => _stopIndividualTimer(pid, participants, disciplineId);
            } else {
                // Not running
                if (stopBtn)  stopBtn.style.display  = 'none';
                if (timeEl)   timeEl.textContent     = '';
                if (startBtn) {
                    startBtn.style.display = '';
                    startBtn.onclick = () => {
                        const s = _getTimerState();
                        if (!s.individual) s.individual = {};
                        s.individual[pid] = Date.now();
                        _saveTimerState(s);
                        setupTimers(participants, disciplineId);
                    };
                }
            }
        });
    }
}

function _stopIndividualTimer(pid, participants, disciplineId) {
    if (_individualTimerIntervals[pid]) { clearInterval(_individualTimerIntervals[pid]); delete _individualTimerIntervals[pid]; }
    const s = _getTimerState();
    const elapsedMs = s.individual?.[pid] ? Date.now() - s.individual[pid] : 0;
    if (s.individual) { delete s.individual[pid]; if (!Object.keys(s.individual).length) delete s.individual; }
    _saveTimerState(s);
    const timeEl = document.querySelector(`#time-value-${pid}`);
    const tr     = timeEl?.closest('tr');
    if (tr) {
        const stopBtn  = tr.querySelector('button.stop-timer');
        const startBtn = tr.querySelector('button.individual-timer');
        if (stopBtn)  stopBtn.style.display  = 'none';
        if (startBtn) { startBtn.style.display = ''; startBtn.onclick = () => {
            const s = _getTimerState();
            if (!s.individual) s.individual = {};
            s.individual[pid] = Date.now();
            _saveTimerState(s);
            setupTimers(participants, disciplineId);
        }; }
        if (timeEl) timeEl.textContent = '';
        const input = _targetAttemptInput(tr);
        if (input && elapsedMs > 0) {
            addMeasurementOrUpdate(pid, disciplineId, parseInt(input.dataset.attempt), convertUnitToFloat(_fmtMs(elapsedMs), 'minutes'))
                .then(() => { displaySyncState(); updateDataInputTable(); })
                .catch(e => console.error('Individual timer save error:', e));
        }
    }
}

async function displaySyncState() {
    const syncMeasurements = await getSyncMeasurements();
    const syncCountElement = document.querySelector("#open-upload-state");
    const lastSyncElement = document.querySelector("#sync-state-con > span#last-time-state");

    let lastSyncText = "Nie synchronisiert";
    var timeDiff = lastSyncedTime ? (new Date().getTime() - lastSyncedTime) : null;
    if (timeDiff && timeDiff < 60 * 1000) {
        lastSyncText = `Vor ${Math.floor(timeDiff / 1000)} Sekunden`;
    } else if (timeDiff && timeDiff < 60 * 60 * 1000) {
        lastSyncText = `Vor ${Math.floor(timeDiff / (60 * 1000))} Minuten`;
    } else if (timeDiff && timeDiff < 24 * 60 * 60 * 1000) {
        lastSyncText = `Vor ${Math.floor(timeDiff / (60 * 60 * 1000))} Stunden`;
    } else if (timeDiff) {
        lastSyncText = `Vor ${Math.floor(timeDiff / (24 * 60 * 60 * 1000))} Tagen`;
    }

    syncCountElement.innerHTML = syncMeasurements.length > 0 ? `${syncMeasurements.length} Versuche <span class="material-icons-round">upload</span>` : "Synchronisiert";
    lastSyncElement.textContent = `${lastSyncText}`;
}

async function syncWithServer() {
    let {classes, disciplines, participants, measurements: serverMeasurements} = await getSyncMeasurements().then(measurements => {
        if (measurements.length === 0) {
            return {classes: null, disciplines: null, participants: null, measurements: null};
        }
        var modifiedMeasurements = measurements.map(m => ({
            id: m.id,
            participant_id: m.participant_id,
            discipline_id: m.discipline_id,
            attempt_number: m.attempt_number,
            value: m.value,
            created_at: m.created_at.split('T').join(' ').split('.')[0], // format from "YYYY-MM-DDTHH:MM:SSZ" to "YYYY-MM-DD HH:MM:SS" for server
            sync_time: m.sync_time
        }));
        return (sync(modifiedMeasurements).then((response) => {
            if (response === null) {
                return;
            }
            measurements.forEach(m => setSyncTime(m.id, new Date()));
            displaySyncState();

            return response;
        }).catch(error => {
            console.error("Error syncing measurements:", error);
            return {classes: null, disciplines: null, participants: null, measurements: null};
        }));
    }).catch(error => {
        console.error("Error getting measurements to sync:", error);
    });
    if (!classes || !disciplines || !participants) {
        ({classes, disciplines, participants, measurements: serverMeasurements} = await getData().catch(error => {
            console.error("Error fetching data after sync failure:", error);
            return {classes: null, disciplines: null, participants: null, measurements: null};
        }));
    }
    if (!classes || !disciplines || !participants) {
        console.warn("No data available for sync. Aborting update.");
        return;
    }

    Promise.all([
        ...classes.map(cls => addClassOrUpdate(cls.name, cls.level)),
        ...disciplines.map(discipline => addDisciplineOrUpdate(discipline.name, discipline.unit, discipline.attempts, discipline.timer, discipline.id)),
        ...participants.map(participant => addParticipantOrUpdate(participant.name, participant.forename, participant.class, participant.gender, participant.id)),
        ...(serverMeasurements ? serverMeasurements.map(measurement => addMeasurementOrUpdate(measurement.participant_id, measurement.discipline_id, measurement.attempt_number, measurement.value, measurement.id, measurement.created_at, new Date())) : [])
    ]).then(() => {
        lastSyncedTime = new Date().getTime();
        updateSelectOptions();
        updateDataInputTable();
    }).catch(error => {
        console.error("Error updating local data after sync:", error);
    });
}

document.addEventListener('keydown', event => {
    if (event.target.tagName === 'INPUT') return;
    const key = event.key.toLowerCase();
    if (key === 'a') {
        document.querySelector('#discipline-select').focus();
    } else if (key === 'k') {
        document.querySelector('#class-select').focus();
    }
});

document.querySelector("dialog#settings-dialog #dark-mode-toggle").addEventListener('click', () => {
    if (document.querySelector("dialog#settings-dialog #dark-mode-toggle").checked) {
        localStorage.setItem(darkModeKey, 'true');
        updateDarkMode();
    } else {
        localStorage.setItem(darkModeKey, 'false');
        updateDarkMode();
    }
});

document.querySelector("dialog#settings-dialog #auto-sync-toggle").addEventListener('click', () => {
    if (document.querySelector("dialog#settings-dialog #auto-sync-toggle").checked) {
        localStorage.setItem(autoSyncKey, 'true');
    } else {
        localStorage.setItem(autoSyncKey, 'false');
    }
});

document.querySelector("dialog#settings-dialog #save-helper-name-btn").addEventListener('click', () => {
    const name = document.querySelector("dialog#settings-dialog #helper-name-input").value.trim();
    if (name) {
        localStorage.setItem(HELPER_NAME_KEY, name);
    } else {
        localStorage.removeItem(HELPER_NAME_KEY);
    }
    window.location.reload();
});

document.querySelector("dialog#settings-dialog #server-hostname-input").value = getHost();
document.querySelector("dialog#settings-dialog #save-server-hostname-btn").addEventListener('click', () => {
    const hostname = document.querySelector("dialog#settings-dialog #server-hostname-input").value.trim();
    if (hostname) {
        setHost(hostname);
    }
});

document.querySelector("dialog#settings-dialog #delete-database-btn").addEventListener('click', () => {
    if (confirm("Möchten Sie wirklich alle lokal gespeicherten Daten löschen? Diese Aktion kann nicht rückgängig gemacht werden.")) {
        deleteDatabase().then(() => {
            alert("Lokale Datenbank wurde gelöscht. Die Seite wird neu geladen.");
            window.location.reload();
        }).catch(error => {
            console.error("Error deleting database:", error);
            alert("Fehler beim Löschen der Datenbank. Bitte versuchen Sie es erneut.");
        });
    }
});

document.querySelector("#sync-state-con button").addEventListener('click', () => {
    syncWithServer();
});

setInterval(() => {
    if (localStorage.getItem(autoSyncKey) === 'true') {
        syncWithServer();
    }
}, 5 * 1000); // every 5 seconds

setInterval(() => {
    document.querySelector("#top-bar div.time-display span").textContent = new Date().toLocaleTimeString();
    displaySyncState();
}, 500);

var serviceWorkerRegistration;

const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator) {
    try {
      serviceWorkerRegistration = await navigator.serviceWorker.register("/webworker.js", {
        scope: "/",
      });
      if (serviceWorkerRegistration.installing) {
        console.log("Service worker installing");
      } else if (serviceWorkerRegistration.waiting) {
        console.log("Service worker installed");
      } else if (serviceWorkerRegistration.active) {
        console.log("Service worker active");
      }
    } catch (error) {
      console.error(`Registration failed with ${error}`);
    }
  }
};

registerServiceWorker();

async function deleteCache() {
    if (serviceWorkerRegistration && serviceWorkerRegistration.active) {
        serviceWorkerRegistration.active.postMessage("deleteCache");
    } else if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage("deleteCache");
    }
}

async function unregisterServiceWorker() {
    serviceWorkerRegistration.unregister().then((boolean) => {
        if (boolean) {
            console.log("Service worker unregistered successfully.");
        }
    })
}