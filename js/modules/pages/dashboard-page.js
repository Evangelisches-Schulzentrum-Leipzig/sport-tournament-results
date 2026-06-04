/**
 * Dashboard page — init, helpers WebSocket view, and filter setup.
 */

import * as api from '../../central-api.js';
import { formatConflicts, computeDisciplineProgressMatrix } from '../../central-logic.js';
import {
    displayDashboardDisciplines,
    displayProgressMatrix,
    displayDashboardConflicts,
    displayDashboardResults,
    populateDashboardClassFilterDropdown,
    populateDashboardClassLevelFilterDropdown,
    populateDashboardDisciplineFilterDropdown
} from '../renderers/dashboard-renderer.js';

export async function init() {
    try {
        const data = await api.getData();
        if (!data) { console.error('Failed to load dashboard data'); return; }

        if (data.disciplines) displayDashboardDisciplines(data.disciplines, data);

        if (data.classes && data.participants && data.disciplines && data.measurements) {
            const progressMatrix = computeDisciplineProgressMatrix(
                data.classes, data.participants, data.disciplines, data.measurements
            );
            displayProgressMatrix(progressMatrix, data.disciplines);
        }

        try {
            const conflicts = await api.getMeasurementConflicts();
            if (conflicts && data) {
                const formattedConflicts = formatConflicts(conflicts, data.participants, data.disciplines, data.classes);
                displayDashboardConflicts(formattedConflicts, data.disciplines);
            }
        } catch (error) {
            console.warn('Failed to load conflicts:', error);
        }

        if (data.classes) {
            populateDashboardClassFilterDropdown(data.classes);
            populateDashboardClassLevelFilterDropdown(data.classes);
        }
        if (data.disciplines) populateDashboardDisciplineFilterDropdown(data.disciplines);
        if (data.measurements) displayDashboardResults(data.measurements, data, {});

        setupFilters(data);
        startHelpersView(data.disciplines);
    } catch (error) {
        console.error('Error initializing dashboard page:', error);
    }
}

function setupFilters(data) {
    const classFilter = document.querySelector('#results-class-filter');
    const classLevelFilter = document.querySelector('#results-classlevel-filter');
    const disciplineFilter = document.querySelector('#results-discipline-filter');

    const applyFilters = () => {
        const filters = {};
        if (classFilter?.value) filters['class'] = classFilter.value;
        if (classLevelFilter?.value) filters['classLevel'] = classLevelFilter.value;
        if (disciplineFilter?.value) filters['disciplineId'] = disciplineFilter.value;

        displayDashboardResults(data.measurements, data, filters);
        displayDashboardDisciplines(data.disciplines, data);
    };

    if (classFilter) classFilter.addEventListener('change', applyFilters);
    if (classLevelFilter) classLevelFilter.addEventListener('change', applyFilters);
    if (disciplineFilter) disciplineFilter.addEventListener('change', applyFilters);
}

function startHelpersView(disciplines) {
    const disciplineMap = new Map((disciplines || []).map(d => [d.id, d.name]));
    api.startCentralWebSocket(helpers => renderHelpers(helpers, disciplineMap));
    setInterval(() => api.centralRequestClients(), 1000);
}

function renderHelpers(helpers, disciplineMap) {
    const container = document.querySelector('#helper-list');
    if (!container) return;
    container.innerHTML = '';
    helpers.forEach(h => {
        const item = document.createElement('div');
        item.className = 'helper-item';
        const discName = h.currentDisciplineId
            ? (disciplineMap.get(h.currentDisciplineId) || h.currentDisciplineId)
            : 'Unbekannt';
        const lastSync = h.lastSync ? timeAgo(new Date(h.lastSync)) : 'Nie';
        const statusClass = h.isAlive ? 'online' : 'offline';
        item.innerHTML = `
            <h3>${h.name}</h3>
            <span class="helper-current-discipline">${discName}</span>
            <span class="helper-last-active">Letzter Sync: ${lastSync}</span>
            <div class="helper-status-indicator ${statusClass}"></div>
        `;
        container.appendChild(item);
    });
}

function timeAgo(date) {
    const diff = Date.now() - date.getTime();
    if (diff < 60 * 1000) return `Vor ${Math.floor(diff / 1000)} Sekunden`;
    if (diff < 60 * 60 * 1000) return `Vor ${Math.floor(diff / (60 * 1000))} Minuten`;
    if (diff < 24 * 60 * 60 * 1000) return `Vor ${Math.floor(diff / (60 * 60 * 1000))} Stunden`;
    return `Vor ${Math.floor(diff / (24 * 60 * 60 * 1000))} Tagen`;
}
