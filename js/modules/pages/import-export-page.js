/**
 * Import/Export page — init and event listener setup.
 */

import { handleImportParticipants } from '../handlers/import-handlers.js';

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
}
