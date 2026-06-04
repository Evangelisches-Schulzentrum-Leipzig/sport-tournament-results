import { getData, sync, checkConnectivity, HELPER_NAME_KEY } from "./helper-api.js";
import { addClassOrUpdate, addDisciplineOrUpdate, addParticipantOrUpdate, addMeasurementOrUpdate, openDatabase, getDisciplines, getClasses, getDisciplineById, getParticipants, getClassMeasurements, getSyncMeasurements, getSyncedMeasurements, setSyncTime } from "./helper-db.js"
import { convertFloatToUnit, convertUnitToFloat } from "./utils.js"

function promptForHelperName() {
    try {
        const existing = localStorage.getItem(HELPER_NAME_KEY);
        if (existing && existing.trim()) return;
        while (true) {
            const input = prompt('Bitte geben Sie Ihren Namen ein:');
            if (input === null) break; // user cancelled
            const name = input.trim();
            if (name) {
                localStorage.setItem(HELPER_NAME_KEY, name);
                break;
            }
            alert('Name darf nicht leer sein.');
        }
    } catch (e) {
        console.error('Unable to access localStorage for helper name:', e);
    }
}

promptForHelperName();

openDatabase().then(async request => {
    const data = await getData();
    if (data) {
        const { classes, disciplines, participants, measurements } = data;
        await Promise.all([
            ...classes.map(cls => addClassOrUpdate(cls.name, cls.level)),
            ...disciplines.map(discipline => addDisciplineOrUpdate(discipline.name, discipline.unit, discipline.attempts, discipline.timer)),
            ...participants.map(participant => addParticipantOrUpdate(participant.name, participant.forename, participant.class, participant.gender)),
            ...measurements.map(measurement => addMeasurementOrUpdate(measurement.participant_id, measurement.discipline_id, measurement.attempt_number, measurement.value, measurement.created_at, new Date()))
        ])
    }
    updateSelectOptions();
    updateDataInputTable();
    displaySyncState();
})

function updateSelectOptions() {
    const disciplineSelect = document.querySelector('#discipline-select');
    const classSelect = document.querySelector('#class-select');
    
    // Clear existing options
    disciplineSelect.innerHTML = '<option value="" disabled selected>Sportart auswählen</option>';
    classSelect.innerHTML = '<option value="" disabled selected>Klasse auswählen</option>';

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
            classSelect.appendChild(optgroup);
        });
    }).catch(error => {
        console.error("Error fetching classes:", error);
    });

    getDisciplines().then(disciplines => {
        disciplines.forEach(discipline => {
            const option = document.createElement('option');
            option.value = discipline.id;
            option.textContent = discipline.name;
            disciplineSelect.appendChild(option);
        });
    }).catch(error => {
        console.error("Error fetching disciplines:", error);
    });

    disciplineSelect.addEventListener('change', updateDataInputTable);
    classSelect.addEventListener('change', updateDataInputTable);
}

async function updateDataInputTable() {
    const disciplineSelect = document.querySelector('#discipline-select');
    const classSelect = document.querySelector('#class-select');
    const disciplineId = parseInt(disciplineSelect.value);
    const className = classSelect.value;
    const tbody = document.querySelector('#data-input-con tbody');
    const thead = document.querySelector('#data-input-con thead');

    if (isNaN(disciplineId) || !className) {
        thead.innerHTML = '<tr></tr>';
        tbody.innerHTML = '<tr><td style="text-align: center;">Bitte wählen Sie eine Sportart und eine Klasse aus.</td></tr>';
        return;
    }

    const discipline = await getDisciplineById(disciplineId);
    console.log("Selected discipline:", discipline);
    const participants = (await getParticipants(className)).sort((a, b) => a.name.localeCompare(b.name) || a.forename.localeCompare(b.forename));
    console.log("Participants in class:", participants);

    if (discipline === null) {
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
        inputHtml.push(`<td><input type="text" data-unit="${discipline.unit}" data-attempt="${index + 1}" data-discipline="${disciplineId}" data-participant="$participant$" value="$measurement$"></td>`);
    }

    thead.innerHTML = `
        <tr${discipline.timer ? ' class="has-timer"' : ''}>
            <th>ID</th>
            <th>Vorname</th>
            <th>Name</th>
            ${Array.from({ length: discipline.attempts }, (_, i) => `<th>Versuch ${i + 1} ${discipline.unit ? `${unitLabel}` : ''}</th>`).join('')}
            ${discipline.timer ? `<th><button><span class="material-icons-round">timer</span> Timer</button></th>` : ''}
        </tr>
    `;
    tbody.innerHTML = '';

    for (const participant of participants) {
        const participantMeasurements = measurements.filter(m => m.participant_id === participant.id).sort((a, b) => a.attempt_number - b.attempt_number);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${participant.id}</td>
            <td>${participant.forename}</td>
            <td>${participant.name}</td>
            ${inputHtml.map((html, index) => {
                const measurement = participantMeasurements.find(m => m.attempt_number === index + 1);
                return html.replace('$measurement$', measurement ? convertFloatToUnit(measurement.value, discipline.unit) : '').replace('$participant$', participant.id);
            }).join('')}
            ${discipline.timer ? `<td><button class="stop-timer"><span class="material-icons-round">stop</span></button><button class="individual-timer"><span class="material-icons-round">timer</span></button></td>` : ''}
        `;
        tbody.appendChild(tr);
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
}

async function displaySyncState() {
    const syncMeasurements = await getSyncMeasurements();
    const syncedMeasurements = await getSyncedMeasurements();
    const lastSyncedTime = syncedMeasurements.length > 0 ? syncedMeasurements.reduce((latest, m) => {
        const syncTime = new Date(m.sync_time).getTime();
        return syncTime > latest ? syncTime : latest;
    }, 0) : null;
    const syncCountElement = document.querySelector("#open-upload-state");
    const lastSyncElement = document.querySelector("#sync-state-con > span:not(#open-upload-state)");

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
        ...disciplines.map(discipline => addDisciplineOrUpdate(discipline.name, discipline.unit, discipline.attempts, discipline.timer)),
        ...participants.map(participant => addParticipantOrUpdate(participant.name, participant.forename, participant.class, participant.gender)),
        ...(serverMeasurements ? serverMeasurements.map(measurement => addMeasurementOrUpdate(measurement.participant_id, measurement.discipline_id, measurement.attempt_number, measurement.value, measurement.created_at, new Date())) : [])
    ]).then(() => {
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

document.querySelector("#sync-state-con button").addEventListener('click', () => {
    syncWithServer();
});

setInterval(() => {
    document.querySelector("#top-bar div.time-display span").textContent = new Date().toLocaleTimeString();
    displaySyncState();
}, 500);