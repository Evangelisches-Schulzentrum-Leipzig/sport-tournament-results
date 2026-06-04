import * as api from '../../central-api.js';
import { formatConflicts } from '../../central-logic.js';
import { displayDashboardConflicts } from '../renderers/dashboard-renderer.js';

export async function handleConflictValueClick(event) {
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
            displayDashboardConflicts(formattedConflicts, data.disciplines);
        }
    } catch (error) {
        console.error('Error resolving conflict:', error);
        alert('Fehler beim Löschen der widersprüchlichen Werte. Bitte versuchen Sie es später erneut.');
    }
}
