/**
 * Handler for bulk-importing participants (and their classes) from a JSON file.
 * Expected JSON format: array of objects with Vorname, Nachname, Geschlecht, Klasse, Status fields.
 */

import * as api from '../../central-api.js';

export async function handleImportParticipants(file) {
    try {
        if (file.type !== 'application/json') {
            alert('Bitte wählen Sie eine gültige JSON-Datei aus');
            return;
        }

        let jsonData;
        try {
            jsonData = JSON.parse(await file.text());
        } catch (parseError) {
            alert('Fehler beim Parsen der JSON-Datei: ' + parseError.message);
            return;
        }

        if (!Array.isArray(jsonData)) {
            alert('JSON-Datei muss ein Array von Teilnehmern sein');
            return;
        }

        // Map and filter participants
        const participants = jsonData
            .filter(item => item['Status'] === 'Aktiv')
            .map(item => {
                let gender = null;
                switch (item['Geschlecht']) {
                    case 'm': case 'M': gender = 'male'; break;
                    case 'w': case 'W': gender = 'female'; break;
                }
                return {
                    forename: item['Vorname'] || '',
                    name: item['Nachname'] || '',
                    gender,
                    class: inferClassLevel(item['Klasse']) !== 0 ? item['Klasse'] : null
                };
            });

        const validParticipants = participants.filter(p =>
            p.forename && p.name && p.class && p.gender &&
            inferClassLevel(p.class) >= 5 && inferClassLevel(p.class) <= 7
        );

        console.log(`Total active: ${participants.length}, valid (class 5-7): ${validParticipants.length}`);

        if (validParticipants.length === 0) {
            alert('Keine gültigen Teilnehmer in der JSON-Datei gefunden');
            return;
        }

        // Infer unique classes from valid participants
        const classMap = new Map();
        validParticipants.forEach(p => {
            if (p.class && !classMap.has(p.class)) {
                classMap.set(p.class, inferClassLevel(p.class));
            }
        });
        const classes = Array.from(classMap.entries())
            .map(([name, level]) => ({ name, level }))
            .filter(c => c.level !== 0);

        // Bulk create classes first
        if (classes.length > 0) {
            const classResult = await api.createClass(classes);
            if (!classResult) { alert('Fehler beim Erstellen der Klassen'); return; }
        }

        // Bulk create participants
        const participantResult = await api.createParticipant(validParticipants);
        if (!participantResult) { alert('Fehler beim Erstellen der Teilnehmer'); return; }

        alert(`Erfolgreich importiert: ${validParticipants.length} Teilnehmer und ${classes.length} Klassen`);
    } catch (error) {
        console.error('Error importing participants:', error);
        alert('Fehler beim Importieren der Datei: ' + error.message);
    }
}

/**
 * Extract the numeric class level from a class name string.
 * Examples: "1a" → 1, "10s" → 10, "9c" → 9
 * @param {string} className
 * @returns {number} Level, or 0 if not parseable
 */
export function inferClassLevel(className) {
    const match = String(className).match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
}
