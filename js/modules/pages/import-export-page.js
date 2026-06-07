/**
 * Import/Export page — init and event listener setup.
 */

import { handleImportParticipants, handleExportParticipants, handleExportParticipantsResults, handleExportParticipantsResultsDividedByClass, handleExportDisciplines, handleExportResults, handleExportAllData } from '../handlers/import-handlers.js';

export async function init() {
    setupEventListeners();
}

function setupEventListeners() {
    const importParticipantsBtn = document.getElementById('import-participants-btn');
    const importParticipantsInput = document.getElementById('import-participants-file-input');

    if (importParticipantsBtn && importParticipantsInput) {
        importParticipantsBtn.addEventListener('click', () => {
            if (importParticipantsInput.files.length > 0) {
                handleImportParticipants(importParticipantsInput.files[0]);
            } else {
                alert('Bitte wählen Sie eine JSON-Datei zum Importieren aus');
            }
        });
    }

    const formatSelect = document.querySelector('#export-format-select');

    const exportParticipantsBtn = document.querySelector('#export-participants-btn');
    if (exportParticipantsBtn) {
        exportParticipantsBtn.addEventListener('click', async () => {
            const format = formatSelect.value;
            var link = await handleExportParticipants(format);
            if (!link) {
                return;
            }
            // Trigger file download
            const a = document.createElement('a');
            a.href = link;
            a.download = `participants.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }

    const exportParticipantsResultsBtn = document.querySelector('#export-participants-results-btn');
    if (exportParticipantsResultsBtn) {
        exportParticipantsResultsBtn.addEventListener('click', async () => {
            const format = formatSelect.value;
            var link = await handleExportParticipantsResults(format);
            if (!link) {
                return;
            }
            // Trigger file download
            const a = document.createElement('a');
            a.href = link;
            a.download = `participants_results.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }

    const exportParticipantsResultsDividedBtn = document.querySelector('#export-participants-results-divided-btn');
    if (exportParticipantsResultsDividedBtn) {
        exportParticipantsResultsDividedBtn.addEventListener('click', async () => {
            const format = formatSelect.value;
            var link = await handleExportParticipantsResultsDividedByClass(format);
            if (!link) {
                return;
            }
            // Trigger file download
            const a = document.createElement('a');
            a.href = link;
            a.download = `participants_results_divided_by_class.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }

    const exportDisciplinesBtn = document.querySelector('#export-disciplines-btn');
    if (exportDisciplinesBtn) {
        exportDisciplinesBtn.addEventListener('click', async () => {
            const format = formatSelect.value;
            var link = await handleExportDisciplines(format);
            if (!link) {
                return;
            }
            // Trigger file download
            const a = document.createElement('a');
            a.href = link;
            a.download = `disciplines.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }

    const exportResultsBtn = document.querySelector('#export-results-btn');
    if (exportResultsBtn) {
        exportResultsBtn.addEventListener('click', async () => {
            const format = formatSelect.value;
            var link = await handleExportResults(format);
            if (!link) {
                return;
            }
            // Trigger file download
            const a = document.createElement('a');
            a.href = link;
            a.download = `results.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }

    const exportAllDataBtn = document.querySelector('#export-all-btn');
    if (exportAllDataBtn) {
        exportAllDataBtn.addEventListener('click', async () => {
            const format = formatSelect.value;
            var link = await handleExportAllData(format);
            if (!link) {
                return;
            }
            // Trigger file download
            const a = document.createElement('a');
            a.href = link;
            a.download = `all_data.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }
}
