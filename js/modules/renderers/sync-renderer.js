/**
 * Render conflict list on the sync page and handle conflict resolution clicks.
 */

import * as api from '../../central-api.js';
import { formatConflicts } from '../../central-logic.js';
import { convertFloatToUnit, unitLabel } from '../../utils.js';

export function displayConflicts(formattedConflicts, disciplines) {
    const conflictsContainer = document.getElementById('conflicts-con');
    if (!conflictsContainer) return;

    conflictsContainer.innerHTML = '';
    const disciplineMap = new Map(disciplines.map(d => [d.id, d]));

    formattedConflicts.forEach(conflict => {
        const discipline = disciplineMap.get(conflict.disciplineId);
        const unit = discipline?.unit || '';
        const unitStr = unitLabel(unit);

        const conflictDiv = document.createElement('div');
        conflictDiv.className = 'conflict-con';

        const headerH3 = document.createElement('h3');
        headerH3.textContent = 'Doppelte Werte';

        const itemDiv = document.createElement('div');
        itemDiv.className = 'conflict-item';

        const valuesHtml = conflict.values.map((v, index) =>
            `<span class="conflict-value"
                data-measurement-id="${v.id}"
                data-conflict-index="${index}"
                style="cursor:pointer;">${convertFloatToUnit(v.value, unit)}${unitStr}</span>`
        ).join('');

        itemDiv.innerHTML = `
            <span class="conflict-item-class">${conflict.className}</span>
            <span class="conflict-item-discipline">${conflict.disciplineName}</span>
            <span class="conflict-item-try">Versuch ${conflict.attemptNumber}</span>
            <span class="conflict-item-participant">${conflict.participantName}</span>
            <div class="conflict-item-values">${valuesHtml}</div>
        `;

        itemDiv.dataset.conflictData = JSON.stringify({
            participantId: conflict.participantId,
            disciplineId: conflict.disciplineId,
            attemptNumber: conflict.attemptNumber,
            valueIds: conflict.values.map(v => v.id)
        });

        conflictDiv.appendChild(headerH3);
        conflictDiv.appendChild(itemDiv);
        conflictsContainer.appendChild(conflictDiv);
    });

    conflictsContainer.querySelectorAll('.conflict-value').forEach(span => {
        span.addEventListener('click', handleConflictValueClick);
    });

    if (formattedConflicts.length === 0) {
        const noConflictsDiv = document.createElement('div');
        noConflictsDiv.style.cssText = 'padding:20px;text-align:center;';
        noConflictsDiv.textContent = 'Keine Konflikte vorhanden';
        conflictsContainer.appendChild(noConflictsDiv);
    }
}

async function handleConflictValueClick(event) {
    event.stopPropagation();

    const valueSpan = event.target;
    const conflictItem = valueSpan.closest('.conflict-item');
    if (!conflictItem) return;

    const conflictData = JSON.parse(conflictItem.dataset.conflictData);
    const selectedMeasurementId = parseInt(valueSpan.dataset.measurementId);
    const measurementIdsToDelete = conflictData.valueIds.filter(id => id !== selectedMeasurementId);

    if (measurementIdsToDelete.length === 0) return;

    const confirmed = confirm(
        `Möchten Sie ${measurementIdsToDelete.length} widersprüchliche Wert(e) löschen und nur diesen Wert behalten?`
    );
    if (!confirmed) return;

    try {
        await Promise.all(measurementIdsToDelete.map(id => api.deleteMeasurement(id)));

        const [conflicts, data] = await Promise.all([api.getMeasurementConflicts(), api.getData()]);
        if (conflicts && data) {
            const formattedConflicts = formatConflicts(conflicts, data.participants, data.disciplines, data.classes);
            displayConflicts(formattedConflicts, data.disciplines);
        }
    } catch (error) {
        console.error('Error resolving conflict:', error);
        alert('Fehler beim Löschen der widersprüchlichen Werte. Bitte versuchen Sie es später erneut.');
    }
}
