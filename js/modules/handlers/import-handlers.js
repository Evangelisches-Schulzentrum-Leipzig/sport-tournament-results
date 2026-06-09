/**
 * Handler for bulk-importing participants (and their classes) from a JSON file.
 * Expected JSON format: array of objects with Vorname, Nachname, Geschlecht, Klasse, Status fields.
 */

import * as api from '../../central-api.js';
import { computeRankings } from '../../central-logic.js';
import { convertFloatToUnit } from '../../utils.js';

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

export async function handleExportParticipants(format) {
    try {
        const participants = await api.getParticipants();
        if (!participants) { alert('Fehler beim Abrufen der Teilnehmer'); return; }

        const exportData = participants.map(p => ({
            ID: p.id,
            Vorname: p.forename,
            Nachname: p.name,
            Geschlecht: p.gender,
            Klasse: p.class,
            Status: "Aktiv"
        }));

        if (format === 'csv') {
            const csvContent = [
                ['ID', 'Vorname', 'Nachname', 'Geschlecht', 'Klasse', 'Status'].map(el => `"${el}"`).join(','),
                ...exportData.map(p => [p.ID, p.Vorname, p.Nachname, p.Geschlecht, p.Klasse, p.Status].map(el => `"${el}"`).join(','))
            ].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            return URL.createObjectURL(blob);
        } else if (format === 'json') {
            // Convert exportData to JSON and trigger download
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            return URL.createObjectURL(blob);
        } else {
            alert('Unbekanntes Exportformat: ' + format);
        }
    } catch (error) {
        console.error('Error exporting participants:', error);
        alert('Fehler beim Exportieren der Teilnehmer: ' + error.message);
    }
}

export async function handleExportParticipantsResults(format, convertUnits = false) {
    try {
        const participants = await api.getParticipants();
        if (!participants) { alert('Fehler beim Abrufen der Teilnehmer'); return; }
        const measurements = await api.getMeasurements();
        if (!measurements) { alert('Fehler beim Abrufen der Messungen'); return; }
        const disciplines = await api.getDisciplines();
        if (!disciplines) { alert('Fehler beim Abrufen der Disziplinen'); return; }
        const markRanges = await api.getMarkRanges();
        if (!markRanges) { alert('Fehler beim Abrufen der Markierungen'); return; }

        const exportData = []; // extended array of participants with their attempt values and final mark for each discipline [{ID, Vorname, Nachname, Geschlecht, Klasse, Disziplin1_Versuch1_Wert, Disziplin_Versuch2_Wert, ..., Disziplin1_Note, Disziplin2_Versuch1_Wert, Disziplin2_Versuch2_Wert, ..., Disziplin2_Note, ...}, ...]
        participants.forEach(p => {
            const participantData = {
                ID: p.id,
                Vorname: p.forename,
                Nachname: p.name,
                Geschlecht: p.gender,
                Klasse: p.class,
            };
            disciplines.forEach(d => {
                const attempts = measurements.filter(m => m.participant_id === p.id && m.discipline_id === d.id);
                attempts.forEach((a, index) => {
                    participantData[`${d.name}_Versuch${a.attempt_number}_Wert`] = convertUnits ? convertFloatToUnit(a.value, d.unit) : a.value;
                });
                const bestAttempt = attempts.reduce((best, a) => a.value > best ? a.value : best, null);
                if (bestAttempt !== null) {
                    const markRange = markRanges.find(mr =>
                        mr.discipline_id === d.id &&
                        mr.class_level === inferClassLevel(p.class) &&
                        mr.gender === p.gender &&
                        bestAttempt >= mr.min_value
                    );
                    participantData[`${d.name}_Note`] = markRange ? markRange.mark : null;
                } else {
                    participantData[`${d.name}_Note`] = null;
                }
            });
            exportData.push(participantData);
        });

        if (format === 'csv') {
            const headers = [...new Set(exportData.flatMap(p => Object.keys(p)))];
            const csvContent = [
                headers.map(h => `"${h}"`).join(','),
                ...exportData.map(p => headers.map(h => p[h] !== undefined ? `"${p[h]}"` : '').join(','))
            ].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            return URL.createObjectURL(blob);
        } else if (format === 'json') {
            // Convert exportData to JSON and trigger download
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            return URL.createObjectURL(blob);
        } else {
            alert('Unbekanntes Exportformat: ' + format);
        }
    } catch (error) {
        console.error('Error exporting participants results:', error);
        alert('Fehler beim Exportieren der Teilnehmerergebnisse: ' + error.message);
    }
}

export async function handleExportParticipantsResultsDividedByClass(format, convertUnits = false) {
    try {
        const classes = await api.getClasses();
        if (!classes) { alert('Fehler beim Abrufen der Klassen'); return; }
        const participants = await api.getParticipants();
        if (!participants) { alert('Fehler beim Abrufen der Teilnehmer'); return; }
        const measurements = await api.getMeasurements();
        if (!measurements) { alert('Fehler beim Abrufen der Messungen'); return; }
        const disciplines = await api.getDisciplines();
        if (!disciplines) { alert('Fehler beim Abrufen der Disziplinen'); return; }
        const markRanges = await api.getMarkRanges();
        if (!markRanges) { alert('Fehler beim Abrufen der Markierungen'); return; }

        // Group participants by class
        const classMap = new Map();
        classes.forEach(c => classMap.set(c.name, c));
        const participantsByClass = new Map();
        participants.forEach(p => {
            const className = p.class;
            if (!participantsByClass.has(className)) {
                participantsByClass.set(className, []);
            }
            participantsByClass.get(className).push(p);
        });
        
        const exportData = []; // extended array of participants with their attempt values and final mark for each discipline [{ID, Vorname, Nachname, Geschlecht, Klasse, Disziplin1_Versuch1_Wert, Disziplin_Versuch2_Wert, ..., Disziplin1_Note, Disziplin2_Versuch1_Wert, Disziplin2_Versuch2_Wert, ..., Disziplin2_Note, ...}, ...]
        participants.forEach(p => {
            const participantData = {
                ID: p.id,
                Vorname: p.forename,
                Nachname: p.name,
                Geschlecht: p.gender,
                Klasse: p.class,
            };
            disciplines.forEach(d => {
                const attempts = measurements.filter(m => m.participant_id === p.id && m.discipline_id === d.id);
                attempts.forEach((a, index) => {
                    participantData[`${d.name}_Versuch${a.attempt_number}_Wert`] = convertUnits ? convertFloatToUnit(a.value, d.unit) : a.value;
                });
                const bestAttempt = attempts.reduce((best, a) => a.value > best ? a.value : best, null);
                if (bestAttempt !== null) {
                    const markRange = markRanges.find(mr =>
                        mr.discipline_id === d.id &&
                        mr.class_level === inferClassLevel(p.class) &&
                        mr.gender === p.gender &&
                        bestAttempt >= mr.min_value
                    );
                    participantData[`${d.name}_Note`] = markRange ? markRange.mark : null;
                } else {
                    participantData[`${d.name}_Note`] = null;
                }
            });
            exportData.push(participantData);
        });
        
        // Group exportData by class
        const exportDataByClass = new Map();
        exportData.forEach(p => {
            const className = p.Klasse;
            if (!exportDataByClass.has(className)) {
                exportDataByClass.set(className, []);
            }
            exportDataByClass.get(className).push(p);
        });

        // create separate CSV/JSON links for each class
        const exportLinks = [];
        exportDataByClass.forEach((data, className) => {
            if (format === 'csv') {
                const headers = [...new Set(data.flatMap(p => Object.keys(p)))];
                const csvContent = [
                    headers.map(h => `"${h}"`).join(','),
                    ...data.map(p => headers.map(h => p[h] !== undefined ? `"${p[h]}"` : '').join(','))
                ].join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv' });
                exportLinks.push({ className, url: URL.createObjectURL(blob) });
            } else if (format === 'json') {
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                exportLinks.push({ className, url: URL.createObjectURL(blob) });
            } else {
                alert('Unbekanntes Exportformat: ' + format);
            }
        });
        return exportLinks;
    } catch (error) {
        console.error('Error exporting participants results by class:', error);
        alert('Fehler beim Exportieren der Teilnehmerergebnisse nach Klasse: ' + error.message);
    }
}
 
export async function handleExportDisciplines(format) {
    try {
        const disciplines = await api.getDisciplines();
        if (!disciplines) { alert('Fehler beim Abrufen der Disziplinen'); return; }

        if (format === 'csv') {
            const csvContent = [
                ['ID', 'Name', 'Einheit', 'Versuche', 'Timer'].map(el => `"${el}"`).join(','),
                ...disciplines.map(d => [d.id, d.name, d.unit, d.attempts, d.timer].map(el => `"${el}"`).join(','))
            ].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            return URL.createObjectURL(blob);
        } else if (format === 'json') {
            // Convert disciplines to JSON and trigger download
            const blob = new Blob([JSON.stringify(disciplines, null, 2)], { type: 'application/json' });
            return URL.createObjectURL(blob);
        } else {
            alert('Unbekanntes Exportformat: ' + format);
        }
    } catch (error) {
        console.error('Error exporting disciplines:', error);
        alert('Fehler beim Exportieren der Disziplinen: ' + error.message);
    }
}

export async function handleExportResults(format, className = null, classLevel = null, disciplineId = null) {
    try {
        const classes = await api.getClasses();
        if (!classes) { alert('Fehler beim Abrufen der Klassen'); return; }
        const participants = await api.getParticipants();
        if (!participants) { alert('Fehler beim Abrufen der Teilnehmer'); return; }
        const measurements = await api.getMeasurements();
        if (!measurements) { alert('Fehler beim Abrufen der Messungen'); return; }
        const disciplines = await api.getDisciplines();
        if (!disciplines) { alert('Fehler beim Abrufen der Disziplinen'); return; }
        const markRanges = await api.getMarkRanges();
        if (!markRanges) { alert('Fehler beim Abrufen der Markierungen'); return; }

        if (className) {
            participants = participants.filter(p => p.class === className);
        }
        if (classLevel) {
            participants = participants.filter(p => inferClassLevel(p.class) === classLevel);
        }
        if (disciplineId) {
            measurements = measurements.filter(m => m.discipline_id === disciplineId);
        }

        const resultsData = computeRankings(classes, participants, disciplines, measurements, markRanges);

        if (format === 'json') {
            const blob = new Blob([JSON.stringify(resultsData, null, 2)], { type: 'application/json' });
            return URL.createObjectURL(blob);
        } else {
            alert('Unbekanntes Exportformat: ' + format);
        }
    } catch (error) {
        console.error('Error exporting results:', error);
        alert('Fehler beim Exportieren der Ergebnisse: ' + error.message);
    }
}

export async function handleExportAllData(format) {
    try {
        const classes = await api.getClasses();
        if (!classes) { alert('Fehler beim Abrufen der Klassen'); return; }
        const participants = await api.getParticipants();
        if (!participants) { alert('Fehler beim Abrufen der Teilnehmer'); return; }
        const measurements = await api.getMeasurements();
        if (!measurements) { alert('Fehler beim Abrufen der Messungen'); return; }
        const disciplines = await api.getDisciplines();
        if (!disciplines) { alert('Fehler beim Abrufen der Disziplinen'); return; }
        const markRanges = await api.getMarkRanges();
        if (!markRanges) { alert('Fehler beim Abrufen der Markierungen'); return; }

        const allData = {
            classes,
            participants,
            measurements,
            disciplines,
            markRanges
        };
        
        if (format === 'json') {
            const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
            return URL.createObjectURL(blob);
        } else {
            alert('Unbekanntes Exportformat: ' + format);
        }
    } catch (error) {
        console.error('Error exporting all data:', error);
        alert('Fehler beim Exportieren aller Daten: ' + error.message);
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
