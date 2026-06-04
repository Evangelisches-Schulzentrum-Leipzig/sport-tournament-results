/**
 * Handlers for creating and deleting participants.
 */

import * as api from '../../central-api.js';
import { displayParticipants } from '../renderers/participants-renderer.js';

export async function handleAddParticipant(data) {
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

    if (!firstName) { alert('Bitte geben Sie einen Vornamen ein'); return; }
    if (!lastName) { alert('Bitte geben Sie einen Nachnamen ein'); return; }
    if (!gender) { alert('Bitte wählen Sie ein Geschlecht aus'); return; }
    if (!selectedClass) { alert('Bitte wählen Sie eine Klasse aus'); return; }

    try {
        const result = await api.createParticipant({
            name: lastName,
            forename: firstName,
            gender: gender,
            class: selectedClass
        });

        if (result) {
            firstNameInput.value = '';
            lastNameInput.value = '';
            genderSelect.value = '';
            classSelect.value = '';

            const updated = await api.getParticipants();
            if (updated) displayParticipants(updated);
        } else {
            alert('Fehler beim Hinzufügen des Teilnehmers');
        }
    } catch (error) {
        console.error('Error adding participant:', error);
        alert('Fehler beim Hinzufügen des Teilnehmers');
    }
}

export async function handleDeleteParticipant(event) {
    const id = parseInt(event.currentTarget?.dataset?.id);
    if (!id) return;
    if (!confirm('Möchten Sie den Teilnehmer wirklich löschen?')) return;

    try {
        const result = await api.deleteParticipant(id);
        if (result !== null) {
            const updated = await api.getParticipants();
            if (updated) displayParticipants(updated);
        } else {
            alert('Fehler beim Löschen des Teilnehmers');
        }
    } catch (err) {
        console.error('Error deleting participant:', err);
        alert('Fehler beim Löschen des Teilnehmers');
    }
}
