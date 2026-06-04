/**
 * Sync page — init, helpers WebSocket view, and conflict list.
 */

import * as api from '../../central-api.js';
import { formatConflicts } from '../../central-logic.js';
import { displayConflicts } from '../renderers/sync-renderer.js';

export async function init() {
    try {
        const [conflicts, data] = await Promise.all([api.getMeasurementConflicts(), api.getData()]);

        if (conflicts && data) {
            const formattedConflicts = formatConflicts(
                conflicts, data.participants, data.disciplines, data.classes
            );
            displayConflicts(formattedConflicts, data.disciplines);
        } else {
            console.warn('Failed to load conflicts or data');
        }

        startHelpersView();
    } catch (error) {
        console.error('Error initializing sync page:', error);
    }
}

function startHelpersView() {
    api.startCentralWebSocket(helpers => renderHelpersTable(helpers));
    setInterval(() => api.centralRequestClients(), 1000);
}

function renderHelpersTable(helpers) {
    const tbody = document.querySelector('#sync-con .sub-con:nth-of-type(2) tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    helpers.forEach(h => {
        const tr = document.createElement('tr');
        const lastDiscipline = h.currentDisciplineId ? h.currentDisciplineId : '';
        const statusIcon = h.isAlive
            ? '<span class="material-icons-round">cloud_circle</span> Live'
            : '<span class="material-icons-round">cloud_off</span> Offline';
        const lastSync = h.lastSync ? timeAgo(new Date(h.lastSync)) : 'Nie';
        tr.innerHTML = `
            <td>${h.name}</td>
            <td>${lastDiscipline}</td>
            <td class="sync-state-con">${statusIcon}</td>
            <td>${lastSync}</td>
            <td>${h.measurementCount || 0}</td>
        `;
        tbody.appendChild(tr);
    });
}

function timeAgo(date) {
    const diff = Date.now() - date.getTime();
    if (diff < 60 * 1000) return `Vor ${Math.floor(diff / 1000)} Sekunden`;
    if (diff < 60 * 60 * 1000) return `Vor ${Math.floor(diff / (60 * 1000))} Minuten`;
    if (diff < 24 * 60 * 60 * 1000) return `Vor ${Math.floor(diff / (60 * 60 * 1000))} Stunden`;
    return `Vor ${Math.floor(diff / (24 * 60 * 60 * 1000))} Tagen`;
}
