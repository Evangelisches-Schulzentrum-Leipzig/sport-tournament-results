/**
 * Render participants and classes to the DOM.
 */

export function displayClasses(classes) {
    const classSection = document.querySelector('#classes-participants-con .sub-con');
    const tbody = classSection?.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    classes.forEach(cls => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${cls.name}</td>
            <td>${cls.level}</td>
            <td>
                <button class="material-icons-round edit-class" data-name="${cls.name}">edit</button>
                <button class="material-icons-round delete-class" data-name="${cls.name}">delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

export function displayParticipants(participants) {
    const subCons = document.querySelectorAll('#classes-participants-con .sub-con');
    const tbody = subCons[1]?.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    participants.forEach(participant => {
        const row = document.createElement('tr');
        const genderLabel = participant.gender === 'male' ? 'Junge' : 'Mädchen';
        row.innerHTML = `
            <td>${participant.name}</td>
            <td>${participant.forename}</td>
            <td>${genderLabel}</td>
            <td>${participant.class}</td>
            <td>
                <button class="material-icons-round edit-participant" data-id="${participant.id}">edit</button>
                <button class="material-icons-round delete-participant" data-id="${participant.id}">delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

export function populateClassFilterDropdown(classes) {
    const filterSelect = document.querySelector('#classes-participants-con .sub-con select[name="class-filter"]');
    if (!filterSelect) return;

    while (filterSelect.options.length > 1) filterSelect.remove(1);

    classes.forEach(cls => {
        const option = document.createElement('option');
        option.value = cls.name;
        option.textContent = cls.name;
        filterSelect.appendChild(option);
    });

    const levelFilter = document.querySelector('#class-level-filter');
    if (levelFilter) {
        while (levelFilter.options.length > 1) levelFilter.remove(1);

        const uniqueLevels = [...new Set(classes.map(c => c.level))].sort((a, b) => a - b);
        uniqueLevels.forEach(level => {
            const option = document.createElement('option');
            option.value = level;
            option.textContent = `${level}. Klasse`;
            levelFilter.appendChild(option);
        });
    }
}
