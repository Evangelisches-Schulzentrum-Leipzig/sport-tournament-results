import * as api from './central-api.js';

/**
 * Initialize page based on current URL
 */
async function initPage() {
    const pathname = window.location.pathname;
    const page = pathname.substring(pathname.lastIndexOf('/') + 1) || 'central.html';
    
    try {
        if (page.includes('central-participants')) {
            await initParticipantsPage();
        } else if (page.includes('central-disciplines')) {
            await initDisciplinesPage();
        } else if (page.includes('central-results')) {
            await initResultsPage();
        } else {
            await initDashboardPage();
        }
    } catch (error) {
        console.error('Error initializing page:', error);
    }
}

async function initParticipantsPage() {
    // Load data
    const data = await Promise.all([
        api.getParticipants(),
        api.getClasses()
    ]).then(([participants, classes]) => ({ participants, classes }))
      .catch(error => {
          console.error('Error loading participants data:', error);
          return null;
      });
    
    if (!data) {
        console.error('Failed to load participants data');
        return;
    }

    // Populate classes table if data available
    if (data.classes) {
        displayClasses(data.classes);
        populateClassFilterDropdown(data.classes);
    }

    // Populate participants table if data available
    if (data.participants) {
        displayParticipants(data.participants);
    }

    // Setup event listeners for filters
    setupParticipantsFilters(data);
}

function displayClasses(classes) {
    const classSection = document.querySelector('#classes-participants-con .sub-con');
    const tbody = classSection?.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    classes.forEach(cls => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${cls.name}</td>
            <td>${cls.level}</td>
            <td>
                <button class="material-icons-round edit-class" data-name="${cls.name}">edit</button>
                <button class="material-icons-round delete-class" data-name="${cls.name}">delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function displayParticipants(participants) {
    const subCons = document.querySelectorAll('#classes-participants-con .sub-con');
    const tbody = subCons[1]?.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    participants.forEach(participant => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${participant.name}</td>
            <td>${participant.forename}</td>
            <td>${participant.class}</td>
            <td>
                <button class="material-icons-round edit-participant" data-id="${participant.id}">edit</button>
                <button class="material-icons-round delete-participant" data-id="${participant.id}">delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function populateClassFilterDropdown(classes) {
    const filterSelect = document.querySelector('#classes-participants-con .sub-con select[name="class-filter"]');
    if (!filterSelect) return;

    // Clear existing options except the first one
    while (filterSelect.options.length > 1) {
        filterSelect.remove(1);
    }

    // Add class options
    classes.forEach(cls => {
        const option = document.createElement('option');
        option.value = cls.name;
        option.textContent = cls.name;
        filterSelect.appendChild(option);
    });

    const levelFilter = document.querySelector('#class-level-filter');
    if (levelFilter) {
        // Clear existing options except the first one
        while (levelFilter.options.length > 1) {
            levelFilter.remove(1);
        }

        // Get unique levels
        const uniqueLevels = [...new Set(classes.map(c => c.level))].sort((a, b) => a - b);
        uniqueLevels.forEach(level => {
            const option = document.createElement('option');
            option.value = level;
            option.textContent = `${level}. Klasse`;
            levelFilter.appendChild(option);
        });
    }
}

function setupParticipantsFilters(data) {
    const classFilter = document.querySelector('#classes-participants-con .sub-con select[name="class-filter"]');
    const searchInput = document.querySelector('#classes-participants-con .sub-con input[name="class-search"]');

    const filterParticipants = async () => {
        const filters = {};
        
        if (classFilter && classFilter.value) {
            filters['class'] = classFilter.value;
        }
        
        if (searchInput && searchInput.value) {
            filters['q'] = searchInput.value;
        }

        const filtered = await api.getParticipants(filters);
        if (filtered) {
            displayParticipants(filtered);
        }
    };

    if (classFilter) classFilter.addEventListener('change', filterParticipants);
    if (searchInput) searchInput.addEventListener('input', filterParticipants);
}

async function initDisciplinesPage() {
    const data = await api.getData();
    
    if (!data) {
        console.error('Failed to load disciplines data');
        return;
    }

    // Display disciplines if data available
    if (data.disciplines) {
        displayDisciplines(data.disciplines);
        populateDisciplineFiltersDropdown(data.disciplines);
    }

    // Setup filter listeners
    setupDisciplinesFilters(data);
}

function displayDisciplines(disciplines) {
    const disciplinesSubCon = document.querySelector('#disciplines-con .sub-con');
    const tbody = disciplinesSubCon?.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    disciplines.forEach(discipline => {
        const row = document.createElement('tr');
        const timerCheckbox = document.createElement('input');
        timerCheckbox.type = 'checkbox';
        timerCheckbox.checked = discipline.timer;
        timerCheckbox.disabled = true;

        const timerCell = document.createElement('td');
        timerCell.appendChild(timerCheckbox);

        row.innerHTML = `
            <td>${discipline.id}</td>
            <td>${discipline.name}</td>
            <td>${discipline.unit}</td>
            <td>${discipline.attempts}</td>
        `;
        row.appendChild(timerCell);
        row.innerHTML += `
            <td>
                <button class="material-icons-round edit-discipline" data-id="${discipline.id}">edit</button>
                <button class="material-icons-round delete-discipline" data-id="${discipline.id}">delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function populateDisciplineFiltersDropdown(disciplines) {
    const disciplinesSubCon = document.querySelector('#disciplines-con .sub-con');
    const filterSelect = disciplinesSubCon?.querySelector('select[name="discipline-filter"]');
    if (!filterSelect) return;

    // Clear existing options except the first one
    while (filterSelect.options.length > 1) {
        filterSelect.remove(1);
    }

    // Add discipline options
    disciplines.forEach(discipline => {
        const option = document.createElement('option');
        option.value = discipline.id;
        option.textContent = discipline.name;
        filterSelect.appendChild(option);
    });
}

function setupDisciplinesFilters(data) {
    const subCon = document.querySelector('#disciplines-con .sub-con');
    if (!subCon) return;

    const searchInput = subCon.querySelector('input[type="text"]');

    const filterDisciplines = async () => {
        const filters = {};
        
        if (searchInput && searchInput.value) {
            filters['q'] = searchInput.value;
        }

        const filtered = await api.getDisciplines(filters);
        if (filtered) {
            displayDisciplines(filtered);
        }
    };

    if (searchInput) searchInput.addEventListener('input', filterDisciplines);
}

async function initResultsPage() {
    const data = await api.getData();
    
    if (!data) {
        console.error('Failed to load results data');
        return;
    }

    // Populate filter dropdowns
    if (data.disciplines && data.disciplines.length > 0) {
        populateResultsDisciplineFilterDropdown(data.disciplines);
    }

    if (data.classes && data.classes.length > 0) {
        populateResultsClassFilterDropdown(data.classes);
    }

    // Display initial results if measurements available
    if (data.measurements && data.measurements.length > 0) {
        displayResults(data.measurements, data);
    }

    // Setup filter listeners
    setupResultsFilters(data);
}

function populateResultsDisciplineFilterDropdown(disciplines) {
    const filterSelect = document.querySelector('#results-table-con')?.parentElement?.querySelector('select[name="discipline"]');
    if (!filterSelect) return;

    // Clear existing options except the first one
    while (filterSelect.options.length > 1) {
        filterSelect.remove(1);
    }

    // Add discipline options
    disciplines.forEach(discipline => {
        const option = document.createElement('option');
        option.value = discipline.id;
        option.textContent = discipline.name;
        filterSelect.appendChild(option);
    });
}

function populateResultsClassFilterDropdown(classes) {
    const filterSelect = document.querySelector('.sub-con select[name="class"]');
    if (!filterSelect) return;

    // Clear existing options except the first one
    while (filterSelect.options.length > 1) {
        filterSelect.remove(1);
    }

    // Add class name options
    const uniqueClasses = [...new Set(classes.map(c => c.name))];
    uniqueClasses.forEach(className => {
        const option = document.createElement('option');
        option.value = className;
        option.textContent = className;
        filterSelect.appendChild(option);
    });
}

function displayResults(measurements, data) {
    // Create a map for quick lookups
    const participantMap = new Map();
    const disciplineMap = new Map();
    
    if (data.participants) {
        data.participants.forEach(p => participantMap.set(p.id, p));
    }
    
    if (data.disciplines) {
        data.disciplines.forEach(d => disciplineMap.set(d.id, d));
    }

    const tbody = document.querySelector('#results-table-con tbody');
    if (!tbody) return;

    // Group measurements by participant
    const byParticipant = new Map();
    measurements.forEach(m => {
        if (!byParticipant.has(m.participant_id)) {
            byParticipant.set(m.participant_id, []);
        }
        byParticipant.get(m.participant_id).push(m);
    });

    tbody.innerHTML = '';
    let place = 1;
    
    byParticipant.forEach((measurements, participantId) => {
        const participant = participantMap.get(participantId);
        if (!participant) return;

        const row = document.createElement('tr');
        let totalPoints = 0;
        let cells = `
            <td>${place}</td>
            <td>${participant.name}</td>
            <td>${participant.forename}</td>
            <td>${participant.class}</td>
        `;

        // Add measurement data for each discipline
        measurements.forEach(m => {
            const discipline = disciplineMap.get(m.discipline_id);
            cells += `
                <td>${m.value}${discipline?.unit || ''}</td>
                <td>0</td>
            `;
            totalPoints += 0; // Points calculation would go here if scoring logic exists
        });

        cells += `<td><strong>${totalPoints}</strong></td>`;
        row.innerHTML = cells;
        tbody.appendChild(row);
        place++;
    });
}

function setupResultsFilters(data) {
    const subCon = document.querySelector('.sub-con');
    if (!subCon) return;

    const disciplineFilter = subCon.querySelector('select[name="discipline"]');
    const classFilter = subCon.querySelector('select[name="class"]');
    const classLevelFilter = subCon.querySelector('select[name="class-level"]');
    const refreshBtn = document.querySelector('#refresh-results-btn');

    const applyFilters = async () => {
        const filters = {};
        
        if (disciplineFilter && disciplineFilter.value) {
            filters['discipline_id'] = disciplineFilter.value;
        }
        
        if (classFilter && classFilter.value) {
            filters['class'] = classFilter.value;
        }

        const filteredData = await api.getData(filters);
        if (filteredData && filteredData.measurements) {
            displayResults(filteredData.measurements, filteredData);
        }
    };

    if (disciplineFilter) disciplineFilter.addEventListener('change', applyFilters);
    if (classFilter) classFilter.addEventListener('change', applyFilters);
    if (classLevelFilter) classLevelFilter.addEventListener('change', applyFilters);
    if (refreshBtn) refreshBtn.addEventListener('click', applyFilters);
}

async function initDashboardPage() {
    const data = await api.getData();
    
    if (!data) {
        console.error('Failed to load dashboard data');
        return;
    }

    // Display disciplines if data available
    if (data.disciplines && data.disciplines.length > 0) {
        displayDashboardDisciplines(data.disciplines, data);
    }

    // Display measurements as live events if available
    if (data.measurements && data.measurements.length > 0) {
        displayLiveEvents(data.measurements, data);
        displayDashboardResults(data.measurements, data);
    }

    // Populate filter dropdowns
    if (data.classes && data.classes.length > 0) {
        populateDashboardClassFilterDropdown(data.classes);
    }

    // Setup dashboard filters
    setupDashboardFilters(data);
}

function displayDashboardDisciplines(disciplines, data) {
    const grid = document.querySelector('#discipline-grid');
    if (!grid) return;

    grid.innerHTML = '';
    
    disciplines.forEach(discipline => {
        // Count measurements for this discipline
        const count = data.measurements?.filter(m => m.discipline_id === discipline.id).length || 0;
        const total = data.participants?.length || 0;
        
        const tile = document.createElement('div');
        tile.className = 'discipline-tile';
        tile.innerHTML = `
            <h3>${discipline.name}</h3>
            <span class="discipline-progress">${count}/${total}</span>
            <span class="discipline-helper">Helper 1, Helper 2</span>
            <span class="discipline-current-class">Klasse 8a</span>
        `;
        grid.appendChild(tile);
    });
}

function displayLiveEvents(measurements, data) {
    const eventList = document.querySelector('#live-event-list');
    if (!eventList) return;

    // Create lookup maps
    const participantMap = new Map();
    const disciplineMap = new Map();
    
    if (data.participants) {
        data.participants.forEach(p => participantMap.set(p.id, p));
    }
    
    if (data.disciplines) {
        data.disciplines.forEach(d => disciplineMap.set(d.id, d));
    }

    eventList.innerHTML = '';
    
    // Display last 6 measurements as events
    const recentMeasurements = measurements.slice(-6).reverse();
    recentMeasurements.forEach(m => {
        const participant = participantMap.get(m.participant_id);
        const discipline = disciplineMap.get(m.discipline_id);
        
        if (!participant || !discipline) return;

        const event = document.createElement('div');
        event.className = 'live-event';
        
        const date = new Date(m.created_at);
        const time = date.toLocaleTimeString('de-DE');
        
        event.innerHTML = `
            <span class="live-event-time">${time}</span>
            <span class="live-event-discipline">${discipline.name}</span>
            <span class="live-event-class">${participant.class}</span>
            <span class="live-event-participant">${participant.forename} ${participant.name}</span>
            <span class="live-event-result">${m.value}${discipline.unit}</span>
        `;
        eventList.appendChild(event);
    });
}

function displayDashboardResults(measurements, data) {
    const resultsList = document.querySelector('#results-list');
    if (!resultsList) return;

    // Create lookup maps
    const participantMap = new Map();
    
    if (data.participants) {
        data.participants.forEach(p => participantMap.set(p.id, p));
    }

    resultsList.innerHTML = '';

    // Group by participant and calculate totals
    const byParticipant = new Map();
    measurements.forEach(m => {
        if (!byParticipant.has(m.participant_id)) {
            byParticipant.set(m.participant_id, { count: 0, participant: participantMap.get(m.participant_id) });
        }
        byParticipant.get(m.participant_id).count++;
    });

    // Sort by count and display
    const sorted = Array.from(byParticipant.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5);

    sorted.forEach((entry, index) => {
        const participant = entry[1].participant;
        if (!participant) return;

        const row = document.createElement('tr');
        const cssClass = index < 3 ? 'results-first-places' : '';
        row.innerHTML = `
            <td class="${cssClass}">${index + 1}</td>
            <td>${participant.name}, ${participant.forename}</td>
            <td>${entry[1].count} Ergebnisse</td>
        `;
        resultsList.appendChild(row);
    });
}

function populateDashboardClassFilterDropdown(classes) {
    const filterSelect = document.querySelector('#results-class-filter');
    if (!filterSelect) return;

    // Clear existing options except the first one
    while (filterSelect.options.length > 1) {
        filterSelect.remove(1);
    }

    // Get unique class names
    const uniqueNames = [...new Set(classes.map(c => c.name))];
    uniqueNames.forEach(className => {
        const option = document.createElement('option');
        option.value = className;
        option.textContent = className;
        filterSelect.appendChild(option);
    });
}

function setupDashboardFilters(data) {
    const classFilter = document.querySelector('#results-class-filter');
    const classLevelFilter = document.querySelector('#results-classlevel-filter');
    const disciplineFilter = document.querySelector('#results-discipline-filter');

    const applyDashboardFilters = async () => {
        const filters = {};
        
        if (classFilter && classFilter.value) {
            filters['class'] = classFilter.value;
        }

        const filteredData = await api.getData(filters);
        if (filteredData) {
            if (filteredData.measurements) {
                displayDashboardResults(filteredData.measurements, filteredData);
                displayLiveEvents(filteredData.measurements, filteredData);
            }
            if (filteredData.participants) {
                displayDashboardDisciplines(data.disciplines, filteredData);
            }
        }
    };

    if (classFilter) classFilter.addEventListener('change', applyDashboardFilters);
    if (classLevelFilter) classLevelFilter.addEventListener('change', applyDashboardFilters);
    if (disciplineFilter) disciplineFilter.addEventListener('change', applyDashboardFilters);
}

// Initialize page when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
} else {
    initPage();
}
