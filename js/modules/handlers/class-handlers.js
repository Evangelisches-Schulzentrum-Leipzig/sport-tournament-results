/**
 * Handlers for creating and deleting classes.
 */

import * as api from '../../central-api.js';
import { displayClasses, populateClassFilterDropdown } from '../renderers/participants-renderer.js';

export async function handleAddClass(data) {
    const nameInput = document.querySelector('#new-class-name');
    const levelInput = document.querySelector('#new-class-level');
    if (!nameInput || !levelInput) { console.error('Input fields not found'); return; }

    const className = nameInput.value.trim();
    const classLevel = parseInt(levelInput.value);

    if (!className) { alert('Bitte geben Sie einen Klassennamen ein'); return; }
    if (isNaN(classLevel)) { alert('Bitte geben Sie eine gültige Klassenstufe ein'); return; }

    try {
        const result = await api.createClass({ name: className, level: classLevel });
        if (result) {
            nameInput.value = '';
            levelInput.value = '';

            const updatedClasses = await api.getClasses();
            if (updatedClasses) {
                displayClasses(updatedClasses);
                populateClassFilterDropdown(updatedClasses);

                // Refresh participant class dropdown if present
                const classSelect = document.querySelector('#new-participant-class');
                if (classSelect) {
                    while (classSelect.options.length > 1) classSelect.remove(1);
                    updatedClasses.forEach(cls => {
                        const option = document.createElement('option');
                        option.value = cls.name;
                        option.textContent = `Klasse ${cls.name}`;
                        classSelect.appendChild(option);
                    });
                }
            }
        } else {
            alert('Fehler beim Hinzufügen der Klasse');
        }
    } catch (error) {
        console.error('Error adding class:', error);
        alert('Fehler beim Hinzufügen der Klasse');
    }
}

export async function handleDeleteClass(event) {
    const name = event.currentTarget?.dataset?.name;
    if (!name) return;
    if (!confirm(`Möchten Sie die Klasse "${name}" wirklich löschen?`)) return;

    try {
        const result = await api.deleteClass(name);
        if (result) {
            const updated = await api.getClasses();
            if (updated) {
                displayClasses(updated);
                populateClassFilterDropdown(updated);

                const classSelect = document.querySelector('#new-participant-class');
                if (classSelect) {
                    while (classSelect.options.length > 1) classSelect.remove(1);
                    updated.forEach(cls => {
                        const option = document.createElement('option');
                        option.value = cls.name;
                        option.textContent = `Klasse ${cls.name}`;
                        classSelect.appendChild(option);
                    });
                }
            }
        } else {
            alert('Fehler beim Löschen der Klasse');
        }
    } catch (err) {
        console.error('Error deleting class:', err);
        alert('Fehler beim Löschen der Klasse');
    }
}
