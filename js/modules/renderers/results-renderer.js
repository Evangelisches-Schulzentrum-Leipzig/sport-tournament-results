/**
 * Render results table and populate results-page filter dropdowns.
 */

import { computeRankings } from '../../central-logic.js';
import { convertFloatToUnit, unitLabel } from '../../utils.js';

export function populateResultsDisciplineFilterDropdown(disciplines) {
    const filterSelect = document.querySelector('#results-table-con')?.parentElement?.querySelector('select[name="discipline"]');
    if (!filterSelect) return;

    while (filterSelect.options.length > 1) filterSelect.remove(1);

    disciplines.forEach(discipline => {
        const option = document.createElement('option');
        option.value = discipline.id;
        option.textContent = discipline.name;
        filterSelect.appendChild(option);
    });
}

export function populateResultsClassFilterDropdown(classes) {
    const filterSelect = document.querySelector('.sub-con select[name="class"]');
    if (!filterSelect) return;

    while (filterSelect.options.length > 1) filterSelect.remove(1);

    [...new Set(classes.map(c => c.name))].forEach(className => {
        const option = document.createElement('option');
        option.value = className;
        option.textContent = className;
        filterSelect.appendChild(option);
    });

    const levelFilter = document.querySelector('.sub-con select[name="class-level"]');
    if (levelFilter) {
        while (levelFilter.options.length > 1) levelFilter.remove(1);

        [...new Set(classes.map(c => c.level))].sort((a, b) => a - b).forEach(level => {
            const option = document.createElement('option');
            option.value = level;
            option.textContent = `${level}. Klasse`;
            levelFilter.appendChild(option);
        });
    }
}

export function displayResults(measurements, data, filters = {}) {
    const participantMap = new Map((data.participants || []).map(p => [p.id, p]));
    const disciplineMap = new Map((data.disciplines || []).map(d => [d.id, d]));
    const classMap = new Map((data.classes || []).map(c => [c.name, c]));

    const thead = document.querySelector('#results-table-con thead');
    const tbody = document.querySelector('#results-table-con tbody');
    if (!thead || !tbody) return;

    let disciplinesToDisplay = data.disciplines || [];
    if (filters.disciplineId) {
        const selected = disciplinesToDisplay.find(d => d.id == filters.disciplineId);
        if (selected) disciplinesToDisplay = [selected];
    }

    const allDisciplinesDisplayed = disciplinesToDisplay.length === (data.disciplines?.length || 0);

    // Rebuild header rows
    const headerRow1 = thead.querySelector('tr:first-child');
    const headerRow2 = thead.querySelector('tr:nth-child(2)');
    while (headerRow1.children.length > 4) headerRow1.removeChild(headerRow1.lastChild);
    while (headerRow2.children.length > 4) headerRow2.removeChild(headerRow2.lastChild);

    disciplinesToDisplay.forEach(discipline => {
        const th1 = document.createElement('th');
        th1.colSpan = 3;
        th1.textContent = discipline.name;
        headerRow1.appendChild(th1);

        ['Wert ' + unitLabel(discipline.unit), 'Punkte', 'Note'].forEach(label => {
            const th = document.createElement('th');
            th.textContent = label;
            headerRow2.appendChild(th);
        });
    });

    if (allDisciplinesDisplayed) {
        const th = document.createElement('th');
        th.textContent = '';
        headerRow1.appendChild(th);
        const totalTh = document.createElement('th');
        totalTh.textContent = 'Punkte gesamt';
        headerRow2.appendChild(totalTh);
    }

    const { disciplineRankings, overallRankings } = computeRankings(
        data.classes, data.participants, data.disciplines, data.measurements, data.markRanges
    );

    tbody.innerHTML = '';
    let place = 1;

    const missingParticipants = (data.participants || []).filter(p => !overallRankings.some(r => r.participantId === p.id));
    const participantsToDisplay = [
        ...overallRankings.map(r => participantMap.get(r.participantId)).filter(Boolean),
        ...missingParticipants
    ];

    participantsToDisplay.forEach(participant => {
        const ranking = overallRankings.find(r => r.participantId === participant.id);
        if (!ranking) return;

        if (filters.class && participant.class !== filters.class) return;
        if (filters.classLevel) {
            const participantClass = classMap.get(participant.class);
            if (!participantClass || participantClass.level != filters.classLevel) return;
        }

        const row = document.createElement('tr');
        let cells = `
            <td>${place}</td>
            <td>${participant.name}</td>
            <td>${participant.forename}</td>
            <td>${participant.class}</td>
        `;

        disciplinesToDisplay.forEach(discipline => {
            const rankingData = disciplineRankings.get(discipline.id)?.find(r => r.participantId === ranking.participantId);
            const disc = disciplineMap.get(discipline.id);
            cells += `
                <td>${rankingData?.value !== null ? convertFloatToUnit(rankingData?.value, disc?.unit) : '-'}</td>
                <td>${rankingData?.value !== null ? disciplineRankings.get(discipline.id).length - disciplineRankings.get(discipline.id).indexOf(rankingData) : 0}</td>
                <td>${rankingData?.mark !== null ? rankingData?.mark : '-'}</td>
            `;
        });

        if (allDisciplinesDisplayed) {
            cells += `<td><strong>${ranking.totalPoints}</strong></td>`;
        }

        row.innerHTML = cells;
        tbody.appendChild(row);
        place++;
    });
}
