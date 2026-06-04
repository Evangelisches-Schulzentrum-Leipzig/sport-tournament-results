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
