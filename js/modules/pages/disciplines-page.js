/**
 * Disciplines page — init, filters, event listeners, delete handlers.
 */

import * as api from '../../central-api.js';
import {
    displayDisciplines,
    populateDisciplineFiltersDropdown,
    displayMarkRanges
} from '../renderers/disciplines-renderer.js';
import {
    handleAddDiscipline,
    handleAddMarkRange,
    handleDeleteDiscipline,
    handleDeleteMarkRange
} from '../handlers/discipline-handlers.js';
import {
    unitLabel
} from '../../utils.js';

export async function init() {
    const data = await api.getData();
    if (!data) { console.error('Failed to load disciplines data'); return; }

    if (data.disciplines) {
        displayDisciplines(data.disciplines);
        populateDisciplineFiltersDropdown(data.disciplines);
    }
    if (data.disciplines && data.markRanges) {
        displayMarkRanges(data.disciplines, data.markRanges);
    }

    setupFilters(data);
    setupEventListeners(data);
    setupDeleteHandlers();
}

function setupFilters(data) {
    const subCon = document.querySelector('#disciplines-con .sub-con');
    const searchInput = subCon?.querySelector('input[type="text"]');

    const filterDisciplines = async () => {
        const filters = {};
        if (searchInput?.value) filters['q'] = searchInput.value;
        const filtered = await api.getDisciplines(filters);
        if (filtered) displayDisciplines(filtered);
    };

    if (searchInput) searchInput.addEventListener('input', filterDisciplines);
}

function setupEventListeners(data) {
    const showAddDisciplineRowBtn = document.querySelector('#show-add-discipline-row-btn');
    const showAddTableRowBtn = document.querySelector('#show-add-table-row-btn');
    const addDisciplineRow = document.querySelector('#add-discipline-row');
    const addTableRow = document.querySelector('#add-table-row');

    if (showAddDisciplineRowBtn && addDisciplineRow) {
        showAddDisciplineRowBtn.addEventListener('click', () => {
            addDisciplineRow.style.display = addDisciplineRow.style.display === 'flex' ? 'none' : 'flex';
        });
    }
    if (showAddTableRowBtn && addTableRow) {
        showAddTableRowBtn.addEventListener('click', () => {
            addTableRow.style.display = addTableRow.style.display === 'flex' ? 'none' : 'flex';
        });
    }

    const addDisciplineBtn = document.querySelector('#add-discipline-btn');
    const addTableBtn = document.querySelector('#add-table-btn');

    // Populate mark range discipline dropdown
    const disciplineSelect = document.querySelector('#new-table-discipline');
    if (disciplineSelect && data.disciplines) {
        while (disciplineSelect.options.length > 1) disciplineSelect.remove(1);
        data.disciplines.forEach(disc => {
            const option = document.createElement('option');
            option.value = disc.id;
            option.textContent = `${disc.name} (${disc.unit})`;
            disciplineSelect.appendChild(option);
        });
    }

    // Populate mark range class level dropdown
    const classSelect = document.querySelector('#new-table-class');
    if (classSelect && data.classes) {
        while (classSelect.options.length > 1) classSelect.remove(1);
        [...new Set(data.classes.map(c => c.level))].sort((a, b) => a - b).forEach(level => {
            const option = document.createElement('option');
            option.value = level;
            option.textContent = `${level}. Klasse`;
            classSelect.appendChild(option);
        });
    }

    // Change mark inputs placeholder and data- based on selected discipline
    const markInputs = document.querySelectorAll('#add-table-row input.mark-input');
    if (disciplineSelect) {
        disciplineSelect.addEventListener('change', () => {
            const selectedDisciplineId = disciplineSelect.value;
            const selectedDiscipline = data.disciplines.find(d => d.id == selectedDisciplineId);
            if (selectedDiscipline) {
                markInputs.forEach(input => {
                    input.placeholder = `${unitLabel(selectedDiscipline.unit)}`;
                    input.dataset.unit = selectedDiscipline.unit;
                });
            } else {
                markInputs.forEach(input => {
                    input.placeholder = 'Wert';
                    input.dataset.unit = '';
                });
            }
        });
    }

    // enforce correct input format
    document.querySelectorAll('#add-table-row input.mark-input').forEach(input => {
        input.addEventListener('input', event => {
            const value = event.target.value;
            const unit = event.target.dataset.unit;
            if (unit === 'minutes') {
                // allow only digits and colon, and enforce MM:SS format
                const cleanedValue = value.replace(/[^0-9:]/g, '');
                const parts = cleanedValue.split(':');
                parts[0] = parts[0] == '' ? '00' : parts[0]; // default minutes to 0 if empty
                if (parts.length > 2) {
                    event.target.value = parts.join(':');
                } else if (parts.length === 2) {
                    const minutes = parts[0]; // allow any number of digits for minutes
                    const seconds = parts[1]; // limit seconds to 2 digits
                    event.target.value = `${minutes}:${seconds}`;
                } else {
                    event.target.value = cleanedValue; // allow any number of digits for minutes until colon is added 
                }
            } else if (unit === 'seconds') {
                // allow only digits and optionally one decimal point
                const cleanedValue = value.replace(/[^0-9,.]/g, '');
                const parts = cleanedValue.split(/[,\.]/);
                parts[0] = parts[0] == '' ? '0' : parts[0]; // default integer part to 0 if empty
                if (parts.length > 2) {
                    event.target.value = parts.join(',');
                } else if (parts.length === 2) {
                    const integerPart = parts[0]; // allow any number of digits for integer part
                    const decimalPart = parts[1]; // limit decimal part to 2 digits
                    event.target.value = `${integerPart},${decimalPart}`;
                } else {
                    event.target.value = cleanedValue; // allow only digits until decimal point is added
                }
            } else if (unit === 'meters') {
                // allow only digits and optionally one decimal point
                const cleanedValue = value.replace(/[^0-9,.]/g, '');
                const parts = cleanedValue.split(/[,\.]/);
                if (parts.length > 2) {
                    event.target.value = parts.join(',');
                } else if (parts.length === 2) {
                    const integerPart = parts[0]; // allow any number of digits for integer part
                    const decimalPart = parts[1]; // limit decimal part to 2 digits
                    event.target.value = `${integerPart},${decimalPart}`;
                } else {
                    event.target.value = cleanedValue; // allow only digits until decimal point is added
                }
            }
        });
    });

    if (addDisciplineBtn) addDisciplineBtn.addEventListener('click', () => handleAddDiscipline(data));
    if (addTableBtn) addTableBtn.addEventListener('click', () => handleAddMarkRange(data));
}

function setupDeleteHandlers() {
    document.querySelectorAll('.delete-discipline').forEach(btn => {
        btn.removeEventListener('click', handleDeleteDiscipline);
        btn.addEventListener('click', handleDeleteDiscipline);
    });
    document.querySelectorAll('.delete-mark-range').forEach(btn => {
        btn.removeEventListener('click', handleDeleteMarkRange);
        btn.addEventListener('click', handleDeleteMarkRange);
    });
}
