/**
 * Participants page — init, filters, event listeners, delete handlers.
 */

import * as api from '../../central-api.js';
import {
    displayClasses,
    displayParticipants,
    populateClassFilterDropdown
} from '../renderers/participants-renderer.js';
import { handleAddClass, handleDeleteClass } from '../handlers/class-handlers.js';
import { handleAddParticipant, handleDeleteParticipant } from '../handlers/participant-handlers.js';

export async function init() {
    const data = await Promise.all([api.getParticipants(), api.getClasses()])
        .then(([participants, classes]) => ({ participants, classes }))
        .catch(error => { console.error('Error loading participants data:', error); return null; });

    if (!data) return;

    if (data.classes) {
        displayClasses(data.classes);
        populateClassFilterDropdown(data.classes);
    }
    if (data.participants) {
        displayParticipants(data.participants);
    }

    setupFilters(data);
    setupEventListeners(data);
    setupDeleteHandlers();
}

function setupFilters(data) {
    const classFilter = document.querySelector('#classes-participants-con .sub-con select[name="class-filter"]');
    const searchInput = document.querySelector('#classes-participants-con .sub-con input[name="class-search"]');

    const filterParticipants = async () => {
        const filters = {};
        if (classFilter?.value) filters['class'] = classFilter.value;
        if (searchInput?.value) filters['q'] = searchInput.value;

        const filtered = await api.getParticipants(filters);
        if (filtered) displayParticipants(filtered);
    };

    if (classFilter) classFilter.addEventListener('change', filterParticipants);
    if (searchInput) searchInput.addEventListener('input', filterParticipants);
}

function setupEventListeners(data) {
    const showAddClassRowBtn = document.querySelector('#show-add-class-row-btn');
    const showAddParticipantRowBtn = document.querySelector('#show-add-participant-row-btn');
    const addClassRow = document.querySelector('#add-class-row');
    const addParticipantRow = document.querySelector('#add-participant-row');

    if (showAddClassRowBtn && addClassRow) {
        showAddClassRowBtn.addEventListener('click', () => {
            addClassRow.style.display = addClassRow.style.display === 'flex' ? 'none' : 'flex';
        });
    }
    if (showAddParticipantRowBtn && addParticipantRow) {
        showAddParticipantRowBtn.addEventListener('click', () => {
            addParticipantRow.style.display = addParticipantRow.style.display === 'flex' ? 'none' : 'flex';
        });
    }

    const addClassBtn = document.querySelector('#add-class-btn');
    const addParticipantBtn = document.querySelector('#add-participant-btn');

    // Populate participant class dropdown
    const classSelect = document.querySelector('#new-participant-class');
    if (classSelect && data.classes) {
        while (classSelect.options.length > 1) classSelect.remove(1);
        data.classes.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls.name;
            option.textContent = `Klasse ${cls.name}`;
            classSelect.appendChild(option);
        });
    }

    if (addClassBtn) addClassBtn.addEventListener('click', () => handleAddClass(data));
    if (addParticipantBtn) addParticipantBtn.addEventListener('click', () => handleAddParticipant(data));
}

function setupDeleteHandlers() {
    document.querySelectorAll('.delete-class').forEach(btn => {
        btn.removeEventListener('click', handleDeleteClass);
        btn.addEventListener('click', handleDeleteClass);
    });
    document.querySelectorAll('.delete-participant').forEach(btn => {
        btn.removeEventListener('click', handleDeleteParticipant);
        btn.addEventListener('click', handleDeleteParticipant);
    });
}
