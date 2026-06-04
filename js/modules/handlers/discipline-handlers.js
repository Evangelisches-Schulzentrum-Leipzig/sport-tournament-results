/**
 * Handlers for creating and deleting disciplines and mark ranges.
 */

import * as api from '../../central-api.js';
import {
    displayDisciplines,
    populateDisciplineFiltersDropdown,
    displayMarkRanges
} from '../renderers/disciplines-renderer.js';

export async function handleAddDiscipline(data) {
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

    if (!disciplineName) { alert('Bitte geben Sie einen Disziplinennamen ein'); return; }
    if (!unit) { alert('Bitte wählen Sie eine Einheit aus'); return; }
    if (isNaN(attempts) || attempts < 1) { alert('Bitte geben Sie eine gültige Anzahl von Versuchen ein'); return; }

    try {
        const result = await api.createDiscipline({ name: disciplineName, unit, attempts, timer: hasTimer });
        if (result) {
            nameInput.value = '';
            unitSelect.value = '';
            attemptsInput.value = '2';
            timerCheckbox.checked = false;

            const updatedDisciplines = await api.getDisciplines();
            if (updatedDisciplines) {
                displayDisciplines(updatedDisciplines);
                populateDisciplineFiltersDropdown(updatedDisciplines);
                refreshDisciplineDropdown(updatedDisciplines);
            }
        } else {
            alert('Fehler beim Hinzufügen der Disziplin');
        }
    } catch (error) {
        console.error('Error adding discipline:', error);
        alert('Fehler beim Hinzufügen der Disziplin');
    }
}

export async function handleAddMarkRange(data) {
    const disciplineSelect = document.querySelector('#new-table-discipline');
    const classSelect = document.querySelector('#new-table-class');
    const genderSelect = document.querySelector('#new-table-gender');
    const markInputs = [1, 2, 3, 4, 5].map(i => document.querySelector(`#new-table-min-${i}`));

    if (!disciplineSelect || !classSelect || !genderSelect || markInputs.some(i => !i)) {
        console.error('Input fields not found');
        return;
    }

    const selectedDiscipline = disciplineSelect.value;
    const selectedClass = classSelect.value;
    const gender = genderSelect.value;
    const marks = markInputs.map(input => input.value.trim());

    if (!selectedDiscipline) { alert('Bitte wählen Sie eine Disziplin aus'); return; }
    if (!selectedClass) { alert('Bitte wählen Sie eine Klassenstufe aus'); return; }
    if (!gender) { alert('Bitte wählen Sie ein Geschlecht aus'); return; }
    if (marks.some(m => !m)) { alert('Bitte füllen Sie alle Noten aus'); return; }

    try {
        let success = true;
        for (let i = 0; i < marks.length; i++) {
            if (isNaN(parseFloat(marks[i]))) {
                alert(`Bitte geben Sie eine gültige Zahl für Note ${i + 1} ein`);
                return;
            }
            const result = await api.createMarkRange({
                discipline_id: parseInt(selectedDiscipline),
                class_level: parseInt(selectedClass),
                gender,
                mark: i + 1,
                min_value: parseFloat(marks[i])
            });
            if (result === null) { success = false; break; }
        }

        if (success) {
            disciplineSelect.value = '';
            classSelect.value = '';
            genderSelect.value = '';
            markInputs.forEach(input => input.value = '');

            const updatedData = await api.getData();
            if (updatedData?.disciplines && updatedData?.markRanges) {
                displayMarkRanges(updatedData.disciplines, updatedData.markRanges);
            }
        } else {
            alert('Fehler beim Hinzufügen der Wertungstabelle');
        }
    } catch (error) {
        console.error('Error adding mark range:', error);
        alert('Fehler beim Hinzufügen der Wertungstabelle');
    }
}

export async function handleDeleteDiscipline(event) {
    const id = parseInt(event.currentTarget?.dataset?.id);
    if (!id) return;
    if (!confirm('Möchten Sie die Disziplin wirklich löschen? Dies entfernt auch zugehörige Wertungen.')) return;

    try {
        const result = await api.deleteDiscipline(id);
        if (result) {
            const updated = await api.getDisciplines();
            if (updated) {
                displayDisciplines(updated);
                populateDisciplineFiltersDropdown(updated);
                refreshDisciplineDropdown(updated);
            }
        } else {
            alert('Fehler beim Löschen der Disziplin');
        }
    } catch (err) {
        console.error('Error deleting discipline:', err);
        alert('Fehler beim Löschen der Disziplin');
    }
}

export async function handleDeleteMarkRange(event) {
    const btn = event.currentTarget;
    const disciplineId = parseInt(btn?.dataset?.disciplineId);
    const classLevel = btn?.dataset?.classLevel;
    const gender = btn?.dataset?.gender;
    if (!disciplineId || !classLevel || !gender) return;

    if (!confirm(`Möchten Sie die Wertungstabelle für Disziplin ${disciplineId}, Klassenstufe ${classLevel}, Geschlecht ${gender} löschen?`)) return;

    try {
        await Promise.all([1, 2, 3, 4, 5, 6].map(m => api.deleteMarkRange(disciplineId, classLevel, gender, String(m))));

        const updatedData = await api.getData();
        if (updatedData?.disciplines && updatedData?.markRanges) {
            displayMarkRanges(updatedData.disciplines, updatedData.markRanges);
        }
    } catch (err) {
        console.error('Error deleting mark range:', err);
        alert('Fehler beim Löschen der Wertungstabelle');
    }
}

// Refresh the discipline dropdown in the mark range form
function refreshDisciplineDropdown(disciplines) {
    const disciplineSelect = document.querySelector('#new-table-discipline');
    if (!disciplineSelect) return;
    while (disciplineSelect.options.length > 1) disciplineSelect.remove(1);
    disciplines.forEach(disc => {
        const option = document.createElement('option');
        option.value = disc.id;
        option.textContent = `${disc.name} (${disc.unit})`;
        disciplineSelect.appendChild(option);
    });
}
