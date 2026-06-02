import * as api from './central-api.js';

/**
 * Initialize page based on current URL pathname.
 * Determines which page to load and calls appropriate initialization function.
 * @async
 * @returns {Promise<void>}
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

/**
 * Initialize the participants page by loading participants and classes data.
 * Displays classes and participants tables and sets up filter event listeners.
 * @async
 * @returns {Promise<void>}
 */
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

/**
 * Display classes in a table with edit and delete buttons.
 * @param {{name: string, level: number}[]} classes - Array of class objects to display
 * @returns {void}
 */
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

/**
 * Display participants in a table with edit and delete buttons.
 * @param {{id: number, name: string, forename: string, class: string}[]} participants - Array of participant objects to display
 * @returns {void}
 */
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

/**
 * Populate class filter dropdowns with available classes and class levels.
 * @param {{name: string, level: number}[]} classes - Array of class objects
 * @returns {void}
 */
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

/**
 * Setup event listeners for participant filter controls.
 * Filters participants by class and search query when filters change.
 * @param {{participants: {id: number, name: string, forename: string, class: string}[], classes: {name: string, level: number}[]}} data - Page data containing participants and classes
 * @returns {void}
 */
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

/**
 * Initialize the disciplines page by loading all data and displaying disciplines.
 * Sets up filter event listeners for discipline search.
 * @async
 * @returns {Promise<void>}
 */
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

/**
 * Display disciplines in a table with edit and delete buttons.
 * @param {{id: number, name: string, unit: string, attempts: number, timer: boolean}[]} disciplines - Array of discipline objects to display
 * @returns {void}
 */
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

/**
 * Populate discipline filter dropdown with available disciplines.
 * @param {{id: number, name: string, unit: string, attempts: number, timer: boolean}[]} disciplines - Array of discipline objects
 * @returns {void}
 */
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

/**
 * Setup event listeners for discipline filter controls.
 * Filters disciplines by search query when input changes.
 * @param {{disciplines: {id: number, name: string, unit: string, attempts: number, timer: boolean}[]}} data - Page data containing disciplines
 * @returns {void}
 */
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

/**
 * Initialize the results page by loading measurements and class data.
 * Displays results table with discipline columns and sets up filter event listeners.
 * @async
 * @returns {Promise<void>}
 */
async function initResultsPage() {
    const data = await api.getData();
    
    if (!data) {
        console.error('Failed to load results data');
        return;
    }

    // Populate filter dropdowns
    if (data.disciplines) {
        populateResultsDisciplineFilterDropdown(data.disciplines);
    }

    if (data.classes) {
        populateResultsClassFilterDropdown(data.classes);
    }

    // Display initial results if measurements available
    if (data.measurements) {
        displayResults(data.measurements, data);
    }

    // Setup filter listeners
    setupResultsFilters(data);
}

/**
 * Populate discipline filter dropdown on the results page.
 * @param {{id: number, name: string, unit: string, attempts: number, timer: boolean}[]} disciplines - Array of discipline objects
 * @returns {void}
 */
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

/**
 * Populate class filter dropdown on the results page with unique class names.
 * @param {{name: string, level: number}[]} classes - Array of class objects
 * @returns {void}
 */
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

    const levelFilter = document.querySelector('.sub-con select[name="class-level"]');
    if (levelFilter) {
        // Clear existing options except the first one
        while (levelFilter.options.length > 1) {
            levelFilter.remove(1);
        }

        // Add class level options
        const uniqueLevels = [...new Set(classes.map(c => c.level))].sort((a, b) => a - b);
        uniqueLevels.forEach(level => {
            const option = document.createElement('option');
            option.value = level;
            option.textContent = `${level}. Klasse`;
            levelFilter.appendChild(option);
        });
    }
}

/**
 * Display measurement results grouped by participant with total points calculation.
 * @param {{id: number, participant_id: number, discipline_id: number, attempt_number: number, value: number, created_at: string}[]} measurements - Array of measurement objects
 * @param {{participants: {id: number, name: string, forename: string, class: string}[], disciplines: {id: number, name: string, unit: string, attempts: number, timer: boolean}[]}} data - Page data containing participants and disciplines
 * @returns {void}
 */
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

/**
 * Setup event listeners for results page filter controls.
 * Filters measurements by discipline and class when filters change.
 * @param {{participants: {id: number, name: string, forename: string, class: string}[], disciplines: {id: number, name: string, unit: string, attempts: number, timer: boolean}[], measurements: {id: number, participant_id: number, discipline_id: number, attempt_number: number, value: number, created_at: string}[], classes: {name: string, level: number}[]}} data - Page data containing all tournament data
 * @returns {void}
 */
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

/**
 * Initialize the dashboard page by loading all tournament data.
 * Displays disciplines, live events, and results summary with filter controls.
 * @async
 * @returns {Promise<void>}
 */
async function initDashboardPage() {
    const data = await api.getData();
    
    if (!data) {
        console.error('Failed to load dashboard data');
        return;
    }

    // Display disciplines if data available
    if (data.disciplines) {
        displayDashboardDisciplines(data.disciplines, data);
    }

    // Populate filter dropdowns
    if (data.classes) {
        populateDashboardClassFilterDropdown(data.classes);
    }

    // Setup dashboard filters
    setupDashboardFilters(data);
}

/**
 * Display disciplines as tiles on the dashboard with progress information.
 * Shows count of completed measurements vs total participants for each discipline.
 * @param {{id: number, name: string, unit: string, attempts: number, timer: boolean}[]} disciplines - Array of discipline objects
 * @param {{participants: {id: number, name: string, forename: string, class: string}[], measurements: {id: number, participant_id: number, discipline_id: number, attempt_number: number, value: number, created_at: string}[]}} data - Page data containing participants and measurements
 * @returns {void}
 */
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

/**
 * Populate class filter dropdown on the dashboard with unique class names.
 * @param {{name: string, level: number}[]} classes - Array of class objects
 * @returns {void}
 */
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

/**
 * Setup event listeners for dashboard filter controls.
 * Filters measurements and disciplines by selected class when filter changes.
 * @param {{participants: {id: number, name: string, forename: string, class: string}[], disciplines: {id: number, name: string, unit: string, attempts: number, timer: boolean}[], measurements: {id: number, participant_id: number, discipline_id: number, attempt_number: number, value: number, created_at: string}[], classes: {name: string, level: number}[]}} data - Page data containing all tournament data
 * @returns {void}
 */
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
