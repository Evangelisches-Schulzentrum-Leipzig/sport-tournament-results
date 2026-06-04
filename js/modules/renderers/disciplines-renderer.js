/**
 * Render disciplines and mark-range tables to the DOM.
 */

export function displayDisciplines(disciplines) {
    const disciplinesSubCon = document.querySelector('#disciplines-con .sub-con');
    const tbody = disciplinesSubCon?.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    disciplines.sort((a, b) => a.id - b.id)
    disciplines.forEach(discipline => {
        const row = document.createElement('tr');
        const timerCheckbox = document.createElement('input');
        timerCheckbox.type = 'checkbox';
        if (discipline.timer == '1' || discipline.timer == 1 || discipline.timer === true) {
            timerCheckbox.setAttribute('checked', '');
        }
        timerCheckbox.disabled = true;

        const timerCell = document.createElement('td');
        timerCell.appendChild(timerCheckbox);

        row.innerHTML = `
            <td>${discipline.id}</td>
            <td>${discipline.name}</td>
            <td>${discipline.unit}</td>
            <td>${discipline.attempts}</td>
        `;
        row.appendChild(timerCell);
        row.innerHTML += `
            <td>
                <button class="material-icons-round edit-discipline" data-id="${discipline.id}">edit</button>
                <button class="material-icons-round delete-discipline" data-id="${discipline.id}">delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

export function populateDisciplineFiltersDropdown(disciplines) {
    const disciplinesSubCon = document.querySelector('#disciplines-con .sub-con');
    const filterSelect = disciplinesSubCon?.querySelector('select[name="discipline-filter"]');
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

export function displayMarkRanges(disciplines, markRanges) {
    const markRangesContainer = document.querySelector('#disciplines-con .sub-con:nth-of-type(2)');
    if (!markRangesContainer) return;

    const inputRow = markRangesContainer.querySelector('.sub-con-input-row');
    const tableContainer = inputRow?.parentElement || markRangesContainer;

    // Remove all existing tables (keep header and input row)
    tableContainer.querySelectorAll('table').forEach(t => t.remove());

    // Group mark ranges by discipline → class_level → gender → mark
    const rangesByDiscipline = {};
    markRanges.forEach(range => {
        if (!rangesByDiscipline[range.discipline_id]) rangesByDiscipline[range.discipline_id] = {};
        if (!rangesByDiscipline[range.discipline_id][range.class_level]) rangesByDiscipline[range.discipline_id][range.class_level] = {};
        if (!rangesByDiscipline[range.discipline_id][range.class_level][range.gender]) rangesByDiscipline[range.discipline_id][range.class_level][range.gender] = {};
        rangesByDiscipline[range.discipline_id][range.class_level][range.gender][range.mark] = range.min_value;
    });

    disciplines.sort((a, b) => a.name.localeCompare(b.name))
    disciplines.forEach(discipline => {
        const table = document.createElement('table');

        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr><th colspan="9">${discipline.name}</th></tr>
            <tr>
                <th>Klassenstufe</th><th>Geschlecht</th>
                <th>Note 1</th><th>Note 2</th><th>Note 3</th>
                <th>Note 4</th><th>Note 5</th><th>Note 6</th>
                <th>Aktionen</th>
            </tr>
        `;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        const classLevels = rangesByDiscipline[discipline.id]
            ? Object.keys(rangesByDiscipline[discipline.id]).map(Number).sort((a, b) => a - b)
            : [];

        if (classLevels.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:20px;">Keine Wertungstabellen definiert</td></tr>`;
        } else {
            classLevels.sort((a, b) => a - b);
            classLevels.forEach(classLevel => {
                var genders = Object.keys(rangesByDiscipline[discipline.id][classLevel]);
                genders.sort((a, b) => a.localeCompare(b));
                genders.forEach(gender => {
                    const marks = rangesByDiscipline[discipline.id][classLevel][gender];
                    const genderLabel = gender === 'male' ? 'Jungen' : 'Mädchen';
                    const markValues = [1, 2, 3, 4, 5, 6].map(i => marks[i] !== undefined ? marks[i] : '-');

                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${classLevel}. Klasse</td>
                        <td>${genderLabel}</td>
                        ${markValues.map(v => `<td>${v}</td>`).join('')}
                        <td>
                            <button class="material-icons-round edit-mark-range"
                                data-discipline-id="${discipline.id}"
                                data-class-level="${classLevel}"
                                data-gender="${gender}">edit</button>
                            <button class="material-icons-round delete-mark-range"
                                data-discipline-id="${discipline.id}"
                                data-class-level="${classLevel}"
                                data-gender="${gender}">delete</button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            });
        }

        table.appendChild(tbody);
        tableContainer.appendChild(table);
    });
}
