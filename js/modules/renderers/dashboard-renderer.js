/**
 * Render dashboard disciplines, progress matrix, conflicts, results and populate dashboard dropdowns.
 */

import { computeRankings, computeDisciplineProgressMatrix } from '../../central-logic.js';
import { convertFloatToUnit, unitLabel } from '../../utils.js';
import { handleConflictValueClick } from '../handlers/dashboard-handler.js';

export function displayDashboardDisciplines(disciplines, data) {
    const grid = document.querySelector('#discipline-grid');
    if (!grid) return;

    const helpers = data.helpers || [];

    grid.innerHTML = '';
    disciplines.sort((a, b) => a.name.localeCompare(b.name))
    disciplines.forEach(discipline => {
        const count = data.measurements?.filter(m => m.discipline_id === discipline.id).length || 0;
        const total = data.participants?.length || 0;

        const assignedHelpers = helpers.filter(h => h.currentDisciplineId === discipline.id);
        const helperNames = assignedHelpers.length > 0
            ? assignedHelpers.map(h => h.name).join(', ')
            : '–';
        const currentClasses = [...new Set(assignedHelpers.map(h => h.currentClass).filter(Boolean))];
        const classDisplay = currentClasses.length > 0 ? currentClasses.join(', ') : '–';

        const tile = document.createElement('div');
        tile.className = 'discipline-tile';
        tile.innerHTML = `
            <h3>${discipline.name}</h3>
            <span class="discipline-progress">${count}/${total}</span>
            <span class="discipline-helper">${helperNames}</span>
            <span class="discipline-current-class">${classDisplay}</span>
        `;
        grid.appendChild(tile);
    });
}

export function displayProgressMatrix(matrix, disciplines) {
    const table = document.querySelector('#progress-matrix');
    if (!table) return;

    disciplines.sort((a, b) => a.name.localeCompare(b.name))

    const thead = table.querySelector('thead');
    if (thead) {
        const headerRow = thead.querySelector('tr');
        if (headerRow) {
            headerRow.innerHTML = '<th>Klasse</th>';
            disciplines.forEach(discipline => {
                const th = document.createElement('th');
                th.textContent = discipline.name;
                headerRow.appendChild(th);
            });
        }
    }

    const tableBody = table.querySelector('tbody');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    Object.keys(matrix).sort().forEach(className => {
        const classProgress = matrix[className];
        const total = classProgress.total || 0;
        if (total === 0) return;

        const row = document.createElement('tr');
        row.innerHTML = `<td>${className}</td>`;

        disciplines.forEach(discipline => {
            const completed = classProgress[discipline.name] || 0;
            const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
            const cell = document.createElement('td');
            cell.innerHTML = `
                <div class="progress-bar-con">
                    <div class="progress-bar">
                        <div class="progress-bar-fill" style="width: ${percentage}%;"></div>
                    </div>
                    <span class="progress-bar-percentage">${completed}/${total}</span>
                </div>
            `;
            row.appendChild(cell);
        });

        tableBody.appendChild(row);
    });
}

export function displayDashboardConflicts(formattedConflicts, disciplines) {
    const conflictList = document.getElementById('conflict-list');
    const conflictCountSpan = document.querySelector('#conflicts .conflict-count');
    if (!conflictList) return;

    conflictList.innerHTML = '';
    const disciplineMap = new Map(disciplines.map(d => [d.id, d]));

    formattedConflicts.sort((a, b) => {
        // sort by discipline name first, then by participant name
        const disciplineA = disciplineMap.get(a.disciplineId)?.name || '';
        const disciplineB = disciplineMap.get(b.disciplineId)?.name || '';
        if (disciplineA === disciplineB) {
            return a.participantName.localeCompare(b.participantName);
        }
        return disciplineA.localeCompare(disciplineB);
    });
    formattedConflicts.forEach(conflict => {
        const discipline = disciplineMap.get(conflict.disciplineId);
        const unit = discipline?.unit || '';
        const unitStr = unitLabel(unit);

        const itemDiv = document.createElement('div');
        itemDiv.className = 'conflict-item';
        itemDiv.innerHTML = `
            <h3 class="conflict-issue">Doppelte Werte</h3>
            <span class="conflict-discipline">${conflict.disciplineName} ${unitStr}</span>
            <span class="conflict-class">${conflict.className}</span>
            <span class="conflict-participant">${conflict.participantName}</span>
            <div class="conflict-values">
                ${conflict.values.map((v, index) =>
                    `<div class="conflict-value-container">
                        <span class="conflict-value"
                            data-measurement-id="${v.id}"
                            data-conflict-index="${index}"
                            style="cursor:pointer;">${convertFloatToUnit(v.value, unit)}</span>
                        <span class="conflict-value-date">${new Date(v.createdAt).toLocaleTimeString()}</span>
                    </div>`
                ).join('')}
            </div>
        `;
        itemDiv.dataset.conflictData = JSON.stringify({
            participantId: conflict.participantId,
            disciplineId: conflict.disciplineId,
            attemptNumber: conflict.attemptNumber,
            valueIds: conflict.values.map(v => v.id)
        });
        conflictList.appendChild(itemDiv);
    });

    conflictList.querySelectorAll('.conflict-value').forEach(span => {
        span.addEventListener('click', handleConflictValueClick);
    });

    if (conflictCountSpan) {
        const count = formattedConflicts.length;
        conflictCountSpan.textContent = `${count} ${count === 1 ? 'Konflikt' : 'Konflikte'}`;
    }

    if (formattedConflicts.length === 0) {
        const noConflictsDiv = document.createElement('div');
        noConflictsDiv.style.cssText = 'padding:20px;text-align:center;';
        noConflictsDiv.textContent = 'Keine Konflikte vorhanden';
        conflictList.appendChild(noConflictsDiv);
    }
}

export function displayDashboardResults(measurements, data, filters = {}) {
    const resultsList = document.querySelector('#results-list');
    if (!resultsList) return;

    const participantMap = new Map((data.participants || []).map(p => [p.id, p]));
    const disciplineMap = new Map((data.disciplines || []).map(d => [d.id, d]));
    const classMap = new Map((data.classes || []).map(c => [c.name, c]));

    const showingSpecificDiscipline = filters.disciplineId && filters.disciplineId !== '';
    const selectedDiscipline = showingSpecificDiscipline
        ? data.disciplines?.find(d => d.id == filters.disciplineId)
        : null;

    const { disciplineRankings, overallRankings } = computeRankings(
        data.classes, data.participants, data.disciplines, data.measurements, data.markRanges
    );

    let place = 1;
    const resultRows = [];

    overallRankings.forEach(ranking => {
        const participant = participantMap.get(ranking.participantId);
        if (!participant) return;

        if (filters.class && participant.class !== filters.class) return;
        if (filters.classLevel) {
            const participantClass = classMap.get(participant.class);
            if (!participantClass || participantClass.level != filters.classLevel) return;
        }

        let displayValue;
        if (showingSpecificDiscipline && selectedDiscipline) {
            const rankingData = disciplineRankings.get(selectedDiscipline.id)?.find(r => r.participantId === ranking.participantId);
            displayValue = rankingData?.value !== null ? convertFloatToUnit(rankingData?.value, selectedDiscipline.unit) : '-';
        } else {
            displayValue = ranking.totalPoints;
        }

        resultRows.push({ place, participantName: `${participant.name}, ${participant.forename}`, value: displayValue });
        place++;
    });

    resultsList.innerHTML = '';
    resultRows.sort((a, b) => a.place - b.place);
    resultRows.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="${index < 3 ? 'results-first-places' : ''}">${row.place}</td>
            <td>${row.participantName}</td>
            <td>${row.value}</td>
        `;
        resultsList.appendChild(tr);
    });
}

export function populateDashboardClassFilterDropdown(classes) {
    const filterSelect = document.querySelector('#results-class-filter');
    if (!filterSelect) return;
    while (filterSelect.options.length > 1) filterSelect.remove(1);
    var classNames = [...new Set(classes.map(c => c.name))];
    classNames.sort((a, b) => a.localeCompare(b));
    classNames.forEach(className => {
        const option = document.createElement('option');
        option.value = className;
        option.textContent = className;
        filterSelect.appendChild(option);
    });
}

export function populateDashboardClassLevelFilterDropdown(classes) {
    const filterSelect = document.querySelector('#results-classlevel-filter');
    if (!filterSelect) return;
    while (filterSelect.options.length > 1) filterSelect.remove(1);
    var levels = [...new Set(classes.map(c => c.level))];
    levels.sort((a, b) => a - b);
    levels.forEach(level => {
        const option = document.createElement('option');
        option.value = level;
        option.textContent = `${level}. Klasse`;
        filterSelect.appendChild(option);
    });
}

export function populateDashboardDisciplineFilterDropdown(disciplines) {
    const filterSelect = document.querySelector('#results-discipline-filter');
    if (!filterSelect) return;
    while (filterSelect.options.length > 1) filterSelect.remove(1);
    disciplines.sort((a, b) => a.name.localeCompare(b.name))
    disciplines.forEach(discipline => {
        const option = document.createElement('option');
        option.value = discipline.id;
        option.textContent = discipline.name;
        filterSelect.appendChild(option);
    });
}
