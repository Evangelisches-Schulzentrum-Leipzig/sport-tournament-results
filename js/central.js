import * as api from './central-api.js';
import { convertFloatToUnit, convertUnitToFloat, unitLabel } from './utils.js';
import { computeRankings, formatConflicts, computeDisciplineProgressMatrix } from './central-logic.js';

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
        } else if (page.includes('central-sync')) {
            await initSyncPage();
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

    // Setup event listeners for add buttons
    setupParticipantsEventListeners(data);
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
 * @param {{id: number, name: string, forename: string, gender: string, class: string}[]} participants - Array of participant objects to display
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
 * @param {{participants: {id: number, name: string, forename: string, gender: string, class: string}[], classes: {name: string, level: number}[]}} data - Page data containing participants and classes
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

    // Display mark ranges tables if data available
    if (data.disciplines && data.markRanges) {
        displayMarkRanges(data.disciplines, data.markRanges);
    }

    // Setup filter listeners
    setupDisciplinesFilters(data);

    // Setup event listeners for add buttons
    setupDisciplinesEventListeners(data);
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
        if (discipline.timer == "1" || discipline.timer == 1 || discipline.timer === true) {
            timerCheckbox.setAttribute('checked', '');
        }
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
 * Display mark ranges for each discipline in separate tables.
 * Creates a table for each discipline showing mark ranges organized by class level and gender.
 * Displays empty message if no mark ranges are defined for a discipline.
 * @param {{id: number, name: string, unit: string, attempts: number, timer: boolean}[]} disciplines - Array of discipline objects
 * @param {{discipline_id: number, class_level: number, gender: string, mark: number, min_value: number}[]} markRanges - Array of mark range objects
 * @returns {void}
 */
function displayMarkRanges(disciplines, markRanges) {
    const markRangesContainer = document.querySelector('#disciplines-con .sub-con:nth-of-type(2)');
    if (!markRangesContainer) return;

    // Find the table container (after the input row)
    const inputRow = markRangesContainer.querySelector('.sub-con-input-row');
    const tableContainer = inputRow?.parentElement || markRangesContainer;
    
    // Remove all existing tables (but keep the header and input row)
    const existingTables = tableContainer.querySelectorAll('table');
    existingTables.forEach(table => table.remove());

    // Group mark ranges by discipline, class_level, and gender
    const rangesByDiscipline = {};
    markRanges.forEach(range => {
        if (!rangesByDiscipline[range.discipline_id]) {
            rangesByDiscipline[range.discipline_id] = {};
        }
        if (!rangesByDiscipline[range.discipline_id][range.class_level]) {
            rangesByDiscipline[range.discipline_id][range.class_level] = {};
        }
        if (!rangesByDiscipline[range.discipline_id][range.class_level][range.gender]) {
            rangesByDiscipline[range.discipline_id][range.class_level][range.gender] = {};
        }
        rangesByDiscipline[range.discipline_id][range.class_level][range.gender][range.mark] = range.min_value;
    });

    // Create a table for each discipline
    disciplines.forEach(discipline => {
        const table = document.createElement('table');
        
        // Create header with discipline name
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = `<th colspan="9">${discipline.name}</th>`;
        const headerRow2 = document.createElement('tr');
        headerRow2.innerHTML = `
            <th>Klassenstufe</th>
            <th>Geschlecht</th>
            <th>Note 1</th>
            <th>Note 2</th>
            <th>Note 3</th>
            <th>Note 4</th>
            <th>Note 5</th>
            <th>Note 6</th>
            <th>Aktionen</th>
        `;
        thead.appendChild(headerRow);
        thead.appendChild(headerRow2);
        table.appendChild(thead);

        // Create tbody
        const tbody = document.createElement('tbody');
        
        // Get all unique class levels for this discipline
        const classLevels = rangesByDiscipline[discipline.id] ? 
            Object.keys(rangesByDiscipline[discipline.id]).map(Number).sort((a, b) => a - b) : [];

        if (classLevels.length === 0) {
            // No mark ranges defined - show empty message
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="9" style="text-align: center; padding: 20px;">Keine Wertungstabellen definiert</td>`;
            tbody.appendChild(row);
        } else {
            // Display mark ranges for each class level and gender
            classLevels.forEach(classLevel => {
                const genders = Object.keys(rangesByDiscipline[discipline.id][classLevel]);
                
                genders.forEach(gender => {
                    const row = document.createElement('tr');
                    const genderLabel = gender === 'male' ? 'Jungen' : 'Mädchen';
                    const marks = rangesByDiscipline[discipline.id][classLevel][gender];
                    
                    // Get mark values for all 6 marks, or empty if not defined
                    const markValues = [];
                    for (let i = 1; i <= 6; i++) {
                        if (marks[i] !== undefined) {
                            markValues.push(marks[i]);
                        } else {
                            markValues.push('-');
                        }
                    }

                    row.innerHTML = `
                        <td>${classLevel}. Klasse</td>
                        <td>${genderLabel}</td>
                        <td>${markValues[0]}</td>
                        <td>${markValues[1]}</td>
                        <td>${markValues[2]}</td>
                        <td>${markValues[3]}</td>
                        <td>${markValues[4]}</td>
                        <td>${markValues[5]}</td>
                        <td>
                            <button class="material-icons-round edit-mark-range" data-discipline-id="${discipline.id}" data-class-level="${classLevel}" data-gender="${gender}">edit</button>
                            <button class="material-icons-round delete-mark-range" data-discipline-id="${discipline.id}" data-class-level="${classLevel}" data-gender="${gender}">delete</button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            });
        }

        table.appendChild(tbody);
        tableContainer.appendChild(table);
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
 * Setup event listeners for add discipline and mark range buttons on disciplines page.
 * Handles adding new disciplines and mark ranges to the database.
 * @param {{disciplines: {id: number, name: string, unit: string, attempts: number, timer: boolean}[], classes: {name: string, level: number}[]}} data - Page data containing disciplines and classes
 * @returns {void}
 */
function setupDisciplinesEventListeners(data) {
    const addDisciplineBtn = document.querySelector('#add-discipline-btn');
    const addTableBtn = document.querySelector('#add-table-btn');

    // Populate mark range discipline dropdown
    const disciplineSelect = document.querySelector('#new-table-discipline');
    if (disciplineSelect && data.disciplines) {
        while (disciplineSelect.options.length > 1) {
            disciplineSelect.remove(1);
        }
        data.disciplines.forEach(disc => {
            const option = document.createElement('option');
            option.value = disc.id;
            option.textContent = `${disc.name} (${disc.unit})`;
            disciplineSelect.appendChild(option);
        });
    }

    // Populate mark range class dropdown
    const classSelect = document.querySelector('#new-table-class');
    if (classSelect && data.classes) {
        while (classSelect.options.length > 1) {
            classSelect.remove(1);
        }
        const uniqueLevels = [...new Set(data.classes.map(c => c.level))].sort((a, b) => a - b);
        uniqueLevels.forEach(level => {
            const option = document.createElement('option');
            option.value = level;
            option.textContent = `${level}. Klasse`;
            classSelect.appendChild(option);
        });
    }

    if (addDisciplineBtn) {
        addDisciplineBtn.addEventListener('click', () => handleAddDiscipline(data));
    }

    if (addTableBtn) {
        addTableBtn.addEventListener('click', () => handleAddMarkRange(data));
    }
}

/**
 * Handle adding a new discipline to the database.
 * Collects form data, validates it, creates the discipline via API, and refreshes the display.
 * @async
 * @param {{disciplines: {id: number, name: string, unit: string, attempts: number, timer: boolean}[], classes: {name: string, level: number}[]}} data - Page data containing disciplines and classes
 * @returns {Promise<void>}
 */
async function handleAddDiscipline(data) {
    const nameInput = document.querySelector('#new-discipline-name');
    const unitSelect = document.querySelector('#new-discipline-unit');
    const attemptsInput = document.querySelector('#new-discipline-attempts');
    const timerCheckbox = document.querySelector('#new-discipline-timer');

    if (!nameInput || !unitSelect || !attemptsInput || !timerCheckbox) {
        console.error('Input fields not found');
        return;
    }

    const disciplineName = nameInput.value.trim();
    const unit = unitSelect.value;
    const attempts = parseInt(attemptsInput.value);
    const hasTimer = timerCheckbox.checked;

    if (!disciplineName) {
        alert('Bitte geben Sie einen Disziplinennamen ein');
        return;
    }

    if (!unit) {
        alert('Bitte wählen Sie eine Einheit aus');
        return;
    }

    if (isNaN(attempts) || attempts < 1) {
        alert('Bitte geben Sie eine gültige Anzahl von Versuchen ein');
        return;
    }

    try {
        const result = await api.createDiscipline({
            name: disciplineName,
            unit: unit,
            attempts: attempts,
            timer: hasTimer
        });

        if (result) {
            // Clear input fields
            nameInput.value = '';
            unitSelect.value = '';
            attemptsInput.value = '2';
            timerCheckbox.checked = false;

            // Refresh disciplines data
            const updatedDisciplines = await api.getDisciplines();
            if (updatedDisciplines) {
                displayDisciplines(updatedDisciplines);
                populateDisciplineFiltersDropdown(updatedDisciplines);
                
                // Update mark range discipline dropdown
                const disciplineSelect = document.querySelector('#new-table-discipline');
                if (disciplineSelect) {
                    while (disciplineSelect.options.length > 1) {
                        disciplineSelect.remove(1);
                    }
                    updatedDisciplines.forEach(disc => {
                        const option = document.createElement('option');
                        option.value = disc.id;
                        option.textContent = `${disc.name} (${disc.unit})`;
                        disciplineSelect.appendChild(option);
                    });
                }
            }
            
            console.log('Disziplin erfolgreich hinzugefügt');
        } else {
            alert('Fehler beim Hinzufügen der Disziplin');
        }
    } catch (error) {
        console.error('Error adding discipline:', error);
        alert('Fehler beim Hinzufügen der Disziplin');
    }
}

/**
 * Handle adding a new mark range (Wertungstabelle) to the database.
 * Collects form data, validates it, creates the mark range via API, and refreshes the display.
 * @async
 * @param {{disciplines: {id: number, name: string, unit: string, attempts: number, timer: boolean}[], classes: {name: string, level: number}[]}} data - Page data containing disciplines and classes
 * @returns {Promise<void>}
 */
async function handleAddMarkRange(data) {
    const disciplineSelect = document.querySelector('#new-table-discipline');
    const classSelect = document.querySelector('#new-table-class');
    const genderSelect = document.querySelector('#new-table-gender');
    
    // Get mark inputs for ranks 1-5
    const markInputs = [1, 2, 3, 4, 5].map(i => document.querySelector(`#new-table-min-${i}`));

    if (!disciplineSelect || !classSelect || !genderSelect || markInputs.some(input => !input)) {
        console.error('Input fields not found');
        return;
    }

    const selectedDiscipline = disciplineSelect.value;
    const selectedClass = classSelect.value;
    const gender = genderSelect.value;
    const marks = markInputs.map(input => input.value.trim());

    if (!selectedDiscipline) {
        alert('Bitte wählen Sie eine Disziplin aus');
        return;
    }

    if (!selectedClass) {
        alert('Bitte wählen Sie eine Klassenstufe aus');
        return;
    }

    if (!gender) {
        alert('Bitte wählen Sie ein Geschlecht aus');
        return;
    }

    // Validate that all mark fields have values
    if (marks.some(mark => !mark)) {
        alert('Bitte füllen Sie alle Noten aus');
        return;
    }

    try {
        let success = true;
        for (let i = 0; i < marks.length; i++) {
            if (isNaN(parseFloat(marks[i]))) {
                alert(`Bitte geben Sie eine gültige Zahl für Note ${i + 1} ein`);
                return;
            }

            var result = await api.createMarkRange({
                discipline_id: parseInt(selectedDiscipline),
                class_level: parseInt(selectedClass),
                gender: gender,
                mark: i + 1,
                min_value: parseFloat(marks[i])
            });
            if (result === null) {
                success = false;
                break;
            }
        }

        if (success) {
            // Clear input fields
            disciplineSelect.value = '';
            classSelect.value = '';
            genderSelect.value = '';
            markInputs.forEach(input => input.value = '');

            // Refresh mark ranges display
            const updatedData = await api.getData();
            if (updatedData && updatedData.disciplines && updatedData.markRanges) {
                displayMarkRanges(updatedData.disciplines, updatedData.markRanges);
            }

            console.log('Wertungstabelle erfolgreich hinzugefügt');
        } else {
            alert('Fehler beim Hinzufügen der Wertungstabelle');
        }
    } catch (error) {
        console.error('Error adding mark range:', error);
        alert('Fehler beim Hinzufügen der Wertungstabelle');
    }
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
        console.log(computeRankings(data.participants, data.disciplines, data.measurements));
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

    const thead = document.querySelector('#results-table-con thead');
    if (!thead) return;
    const tbody = document.querySelector('#results-table-con tbody');
    if (!tbody) return;

    // Build table header with discipline columns
    const headerRow1 = thead.querySelector('tr:first-child');
    const headerRow2 = thead.querySelector('tr:nth-child(2)');

    // Clear existing discipline columns
    while (headerRow1.children.length > 4) {
        headerRow1.removeChild(headerRow1.lastChild);
    }
    while (headerRow2.children.length > 4) {
        headerRow2.removeChild(headerRow2.lastChild);
    }
    
    // Add discipline columns
    if (data.disciplines) {
        data.disciplines.forEach(discipline => {
            const th1 = document.createElement('th');
            th1.colSpan = 2;
            th1.textContent = discipline.name;
            headerRow1.appendChild(th1);

            const thValue = document.createElement('th');
            thValue.textContent = `Wert ${unitLabel(discipline.unit)}`;
            headerRow2.appendChild(thValue);

            const thPoints = document.createElement('th');
            thPoints.textContent = 'Punkte';
            headerRow2.appendChild(thPoints);
        });
    }

    // Add total points filler header
    const totalTh = document.createElement('th');
    totalTh.colSpan = 2;
    totalTh.textContent = '';
    headerRow1.appendChild(totalTh);

    // Add total points header
    const totalTh1 = document.createElement('th');
    totalTh1.textContent = 'Punkte gesamt';
    headerRow2.appendChild(totalTh1);

    const { disciplineRankings, overallRankings } = computeRankings(data.participants, data.disciplines, data.measurements);

    tbody.innerHTML = '';
    let place = 1;
    
    overallRankings.forEach(ranking => {
        const participant = participantMap.get(ranking.participantId);
        if (!participant) return;

        const row = document.createElement('tr');
        let totalPoints = ranking.totalPoints;
        let cells = `
            <td>${place}</td>
            <td>${participant.name}</td>
            <td>${participant.forename}</td>
            <td>${participant.class}</td>
        `;

        // Add value and points cells for each discipline
        data.disciplines.forEach(discipline => {
            const disciplineData = disciplineMap.get(discipline.id);
            const rankingData = disciplineRankings.get(discipline.id)?.find(r => r.participantId === ranking.participantId);
            cells += `
                <td>${rankingData?.value !== null ? convertFloatToUnit(rankingData?.value, disciplineData?.unit) : '-'}</td>
                <td>${rankingData && rankingData.value !== null ? disciplineRankings.get(discipline.id).length - disciplineRankings.get(discipline.id).indexOf(rankingData) : 0}</td>
            `;
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

    // Compute and display progress matrix
    if (data.classes && data.participants && data.disciplines && data.measurements) {
        const progressMatrix = computeDisciplineProgressMatrix(
            data.classes,
            data.participants,
            data.disciplines,
            data.measurements
        );
        displayProgressMatrix(progressMatrix, data.disciplines);
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
 * Display progress matrix showing participant completion status by class and discipline.
 * Renders as a table with progress bars and percentages.
 * @param {{[className: string]: {[disciplineName: string]: number, total: number}}} matrix - Progress matrix from computeDisciplineProgressMatrix
 * @param {{id: number, name: string, unit: string, attempts: number, timer: boolean}[]} disciplines - Array of discipline objects for column ordering
 * @returns {void}
 */
function displayProgressMatrix(matrix, disciplines) {
    const table = document.querySelector('#progress-matrix');
    if (!table) return;

    // Update table header
    const thead = table.querySelector('thead');
    if (thead) {
        const headerRow = thead.querySelector('tr');
        if (headerRow) {
            headerRow.innerHTML = '<th>Klasse</th>';
            disciplines.forEach(discipline => {
                const th = document.createElement('th');
                th.textContent = discipline.name;
                headerRow.appendChild(th);
            });
        }
    }

    // Update table body
    const tableBody = table.querySelector('tbody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    // Sort classes alphabetically for consistent display
    const classNames = Object.keys(matrix).sort();

    classNames.forEach(className => {
        const classProgress = matrix[className];
        const total = classProgress.total || 0;
        
        // Only display rows with at least one participant
        if (total === 0) return;
        
        const row = document.createElement('tr');
        row.innerHTML = `<td>${className}</td>`;

        // Add progress cells for each discipline
        disciplines.forEach(discipline => {
            const completed = classProgress[discipline.name] || 0;
            const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

            const cell = document.createElement('td');
            cell.innerHTML = `
                <div class="progress-bar-con">
                    <div class="progress-bar">
                        <div class="progress-bar-fill" style="width: ${percentage}%;"></div>
                    </div>
                    <span class="progress-bar-percentage">${completed}/${total}</span>
                </div>
            `;
            row.appendChild(cell);
        });

        tableBody.appendChild(row);
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

/**
 * Setup event listeners for add class and participant buttons on participants page.
 * Handles adding new classes and participants to the database.
 * @param {{participants: {id: number, name: string, forename: string, gender: string, class: string}[], classes: {name: string, level: number}[]}} data - Page data containing participants and classes
 * @returns {void}
 */
function setupParticipantsEventListeners(data) {
    const addClassBtn = document.querySelector('#add-class-btn');
    const addParticipantBtn = document.querySelector('#add-participant-btn');

    // Populate new-participant-class dropdown
    const classSelect = document.querySelector('#new-participant-class');
    if (classSelect && data.classes) {
        while (classSelect.options.length > 1) {
            classSelect.remove(1);
        }
        data.classes.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls.name;
            option.textContent = `Klasse ${cls.name}`;
            classSelect.appendChild(option);
        });
    }

    if (addClassBtn) {
        addClassBtn.addEventListener('click', () => handleAddClass(data));
    }

    if (addParticipantBtn) {
        addParticipantBtn.addEventListener('click', () => handleAddParticipant(data));
    }
}

/**
 * Handle adding a new class to the database.
 * Collects form data, validates it, creates the class via API, and refreshes the display.
 * @async
 * @param {{participants: {id: number, name: string, forename: string, gender: string, class: string}[], classes: {name: string, level: number}[]}} data - Page data containing participants and classes
 * @returns {Promise<void>}
 */
async function handleAddClass(data) {
    const nameInput = document.querySelector('#new-class-name');
    const levelInput = document.querySelector('#new-class-level');

    if (!nameInput || !levelInput) {
        console.error('Input fields not found');
        return;
    }

    const className = nameInput.value.trim();
    const classLevel = parseInt(levelInput.value);

    if (!className) {
        alert('Bitte geben Sie einen Klassennamen ein');
        return;
    }

    if (isNaN(classLevel)) {
        alert('Bitte geben Sie eine gültige Klassenstufe ein');
        return;
    }

    try {
        const result = await api.createClass({
            name: className,
            level: classLevel
        });

        if (result) {
            // Clear input fields
            nameInput.value = '';
            levelInput.value = '';

            // Refresh classes data
            const updatedClasses = await api.getClasses();
            if (updatedClasses) {
                displayClasses(updatedClasses);
                populateClassFilterDropdown(updatedClasses);
                
                // Update participant class dropdown
                const classSelect = document.querySelector('#new-participant-class');
                if (classSelect) {
                    while (classSelect.options.length > 1) {
                        classSelect.remove(1);
                    }
                    updatedClasses.forEach(cls => {
                        const option = document.createElement('option');
                        option.value = cls.name;
                        option.textContent = `Klasse ${cls.name}`;
                        classSelect.appendChild(option);
                    });
                }
            }
            
            console.log('Klasse erfolgreich hinzugefügt');
        } else {
            alert('Fehler beim Hinzufügen der Klasse');
        }
    } catch (error) {
        console.error('Error adding class:', error);
        alert('Fehler beim Hinzufügen der Klasse');
    }
}

/**
 * Handle adding a new participant to the database.
 * Collects form data, validates it, creates the participant via API, and refreshes the display.
 * @async
 * @param {{participants: {id: number, name: string, forename: string, gender: string, class: string}[], classes: {name: string, level: number}[]}} data - Page data containing participants and classes
 * @returns {Promise<void>}
 */
async function handleAddParticipant(data) {
    const firstNameInput = document.querySelector('#new-participant-first-name');
    const lastNameInput = document.querySelector('#new-participant-last-name');
    const genderSelect = document.querySelector('#new-participant-gender');
    const classSelect = document.querySelector('#new-participant-class');

    if (!firstNameInput || !lastNameInput || !genderSelect || !classSelect) {
        console.error('Input fields not found');
        return;
    }

    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const gender = genderSelect.value;
    const selectedClass = classSelect.value;

    if (!firstName) {
        alert('Bitte geben Sie einen Vornamen ein');
        return;
    }

    if (!lastName) {
        alert('Bitte geben Sie einen Nachnamen ein');
        return;
    }

    if (!gender) {
        alert('Bitte wählen Sie ein Geschlecht aus');
        return;
    }

    if (!selectedClass) {
        alert('Bitte wählen Sie eine Klasse aus');
        return;
    }

    try {
        const result = await api.createParticipant({
            name: lastName,
            forename: firstName,
            gender: gender,
            class: selectedClass
        });

        if (result) {
            // Clear input fields
            firstNameInput.value = '';
            lastNameInput.value = '';
            genderSelect.value = '';
            classSelect.value = '';

            // Refresh participants data
            const updatedParticipants = await api.getParticipants();
            if (updatedParticipants) {
                displayParticipants(updatedParticipants);
            }
            
            console.log('Teilnehmer erfolgreich hinzugefügt');
        } else {
            alert('Fehler beim Hinzufügen des Teilnehmers');
        }
    } catch (error) {
        console.error('Error adding participant:', error);
        alert('Fehler beim Hinzufügen des Teilnehmers');
    }
}

/**
 * Initialize the sync page by loading conflicts and displaying them.
 * @async
 * @returns {Promise<void>}
 */
async function initSyncPage() {
    try {
        // Load conflicts and other data
        const [conflicts, data] = await Promise.all([
            api.getMeasurementConflicts(),
            api.getData()
        ]);

        if (conflicts && data) {
            // Format conflicts with participant and discipline information
            const formattedConflicts = formatConflicts(
                conflicts,
                data.participants,
                data.disciplines,
                data.classes
            );
            
            // Display conflicts
            displayConflicts(formattedConflicts, data.disciplines);
        } else {
            console.warn('Failed to load conflicts or data');
        }
    } catch (error) {
        console.error('Error initializing sync page:', error);
    }
}

/**
 * Display conflicts in the conflicts container.
 * @param {Array} formattedConflicts - Array of formatted conflicts
 * @param {{id: number, name: string, unit: string, attempts: number, timer: boolean}[]} disciplines
 * @returns {void}
 */
function displayConflicts(formattedConflicts, disciplines) {
    const conflictsContainer = document.getElementById('conflicts-con');
    if (!conflictsContainer) return;

    // Clear existing content
    conflictsContainer.innerHTML = '';

    // Create a discipline map for quick unit lookup
    const disciplineMap = new Map(disciplines.map(d => [d.id, d]));

    // Display each conflict
    formattedConflicts.forEach(conflict => {
        const discipline = disciplineMap.get(conflict.disciplineId);
        const unit = discipline?.unit || '';
        const unitStr = unitLabel(unit);

        // Create conflict container
        const conflictDiv = document.createElement('div');
        conflictDiv.className = 'conflict-con';
        
        // Create header
        const headerH3 = document.createElement('h3');
        headerH3.textContent = 'Doppelte Werte';
        
        // Create conflict item
        const itemDiv = document.createElement('div');
        itemDiv.className = 'conflict-item';
        
        // Build HTML for the conflict item
        itemDiv.innerHTML = `
            <span class="conflict-item-class">${conflict.className}</span>
            <span class="conflict-item-discipline">${conflict.disciplineName}</span>
            <span class="conflict-item-try">Versuch ${conflict.attemptNumber}</span>
            <span class="conflict-item-participant">${conflict.participantName}</span>
            <div class="conflict-item-values">
                ${conflict.values.map(v => `<span>${convertFloatToUnit(v.value, unit)}${unitStr}</span>`).join('')}
            </div>
        `;
        
        conflictDiv.appendChild(headerH3);
        conflictDiv.appendChild(itemDiv);
        conflictsContainer.appendChild(conflictDiv);
    });

    // Show message if no conflicts
    if (formattedConflicts.length === 0) {
        const noConflictsDiv = document.createElement('div');
        noConflictsDiv.style.padding = '20px';
        noConflictsDiv.style.textAlign = 'center';
        noConflictsDiv.textContent = 'Keine Konflikte vorhanden';
        conflictsContainer.appendChild(noConflictsDiv);
    }
}

// Initialize page when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
} else {
    initPage();
}
