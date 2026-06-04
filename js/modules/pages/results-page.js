/**
 * Results page — init and filter setup.
 */

import * as api from '../../central-api.js';
import {
    displayResults,
    populateResultsDisciplineFilterDropdown,
    populateResultsClassFilterDropdown
} from '../renderers/results-renderer.js';

export async function init() {
    const data = await api.getData();
    if (!data) { console.error('Failed to load results data'); return; }

    if (data.disciplines) populateResultsDisciplineFilterDropdown(data.disciplines);
    if (data.classes) populateResultsClassFilterDropdown(data.classes);
    if (data.measurements) displayResults(data.measurements, data, {});

    setupFilters(data);
}

function setupFilters(data) {
    const subCon = document.querySelector('.sub-con');
    if (!subCon) return;

    const disciplineFilter = subCon.querySelector('select[name="discipline"]');
    const classFilter = subCon.querySelector('select[name="class"]');
    const classLevelFilter = subCon.querySelector('select[name="class-level"]');
    const refreshBtn = document.querySelector('#refresh-results-btn');

    const applyFilters = () => {
        const filters = {};
        if (disciplineFilter?.value) filters['disciplineId'] = disciplineFilter.value;
        if (classFilter?.value) filters['class'] = classFilter.value;
        if (classLevelFilter?.value) filters['classLevel'] = classLevelFilter.value;
        displayResults(data.measurements, data, filters);
    };

    if (disciplineFilter) disciplineFilter.addEventListener('change', applyFilters);
    if (classFilter) classFilter.addEventListener('change', applyFilters);
    if (classLevelFilter) classLevelFilter.addEventListener('change', applyFilters);
    if (refreshBtn) refreshBtn.addEventListener('click', applyFilters);
}
