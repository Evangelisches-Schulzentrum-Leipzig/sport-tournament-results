async function getClasses() {
    return (await (await fetch("http://localhost:80/classes")).json());
}

async function getParticipants() {
    return (await (await fetch("http://localhost:80/participants")).json());
}

async function getDisciplines() {
    return (await (await fetch("http://localhost:80/disciplines")).json());
}

async function insertClass() {
    const name = document.querySelector("#class-name-input").value;
    const level = document.querySelector("#class-level-input").value;
    
    if (!name || !level) {
        alert("Bitte alle Felder ausfüllen");
        return;
    }
    
    try {
        await fetch("http://localhost:80/classes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, level: Number(level) })
        });
        document.querySelector("#class-name-input").value = "";
        document.querySelector("#class-level-input").value = "";
        await display();
    } catch (error) {
        console.error("Error inserting class:", error);
    }
}

async function insertParticipant() {
    const name = document.querySelector("#participant-name-input").value;
    const forename = document.querySelector("#participant-forename-input").value;
    const className = document.querySelector("#participant-class-select").value;
    const remarks = document.querySelector("#participant-remarks-input").value;
    
    if (!name || !forename || !className) {
        alert("Bitte alle Felder ausfüllen");
        return;
    }
    
    try {
        await fetch("http://localhost:80/participants", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, forename, class: className, remarks })
        });
        document.querySelector("#participant-name-input").value = "";
        document.querySelector("#participant-forename-input").value = "";
        document.querySelector("#participant-remarks-input").value = "";
        await display();
    } catch (error) {
        console.error("Error inserting participant:", error);
    }
}

async function insertDiscipline() {
    const name = document.querySelector("#discipline-name-input").value;
    const unit = document.querySelector("#discipline-unit-input").value;
    const timer = document.querySelector("#discipline-timer-input").checked;
    
    if (!name || !unit) {
        alert("Bitte alle Felder ausfüllen");
        return;
    }
    
    try {
        await fetch("http://localhost:80/disciplines", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, unit, timer })
        });
        document.querySelector("#discipline-name-input").value = "";
        document.querySelector("#discipline-unit-input").value = "";
        document.querySelector("#discipline-timer-input").checked = false;
        await display();
    } catch (error) {
        console.error("Error inserting discipline:", error);
    }
}

async function handleDelete(event) {
    const btn = event.target;
    if (!btn.classList.contains("delete-btn")) return;
    
    const type = btn.dataset.type;
    const classNameToDelete = btn.dataset.name;
    const id = btn.dataset.id;
    
    try {
        if (type === "class") {
            await fetch(`http://localhost:80/classes/${classNameToDelete}`, { method: "DELETE" });
        } else if (type === "participant") {
            await fetch(`http://localhost:80/participants/${id}`, { method: "DELETE" });
        } else if (type === "discipline") {
            await fetch(`http://localhost:80/disciplines/${id}`, { method: "DELETE" });
        }
        await display();
    } catch (error) {
        console.error("Error deleting item:", error);
    }
}

function assignEventListeners() {
    // Delete button listeners
    document.querySelectorAll("#classes-con button").forEach(el => el.removeEventListener("click", handleDelete));
    document.querySelectorAll("#classes-con button").forEach(el => el.addEventListener("click", handleDelete));
    
    document.querySelectorAll("#participants-con button").forEach(el => el.removeEventListener("click", handleDelete));
    document.querySelectorAll("#participants-con button").forEach(el => el.addEventListener("click", handleDelete));
    
    document.querySelectorAll("#disciplines-con button").forEach(el => el.removeEventListener("click", handleDelete));
    document.querySelectorAll("#disciplines-con button").forEach(el => el.addEventListener("click", handleDelete));
    
    // Insert button listeners
    document.querySelector("#add-class-button").removeEventListener("click", insertClass);
    document.querySelector("#add-class-button").addEventListener("click", insertClass);
    
    document.querySelector("#add-participant-button").removeEventListener("click", insertParticipant);
    document.querySelector("#add-participant-button").addEventListener("click", insertParticipant);
    
    document.querySelector("#add-discipline-button").removeEventListener("click", insertDiscipline);
    document.querySelector("#add-discipline-button").addEventListener("click", insertDiscipline);
}

async function display() {
    document.querySelector("#classes-con tbody").innerHTML = "";
    for (const clas of (await getClasses())) {
        document.querySelector("#classes-con tbody").innerHTML += "<tr>" +
            "<td>" + clas.name + "</td>" +
            "<td>" + clas.level + "</td>" +
            "<td><button class='delete-btn' data-type='class' data-name='" + clas.name + "'>Löschen</button></td>" +
        "</tr>";
    }
    
    document.querySelector("#participants-con tbody").innerHTML = ""
    for (const participant of (await getParticipants())) {
        document.querySelector("#participants-con tbody").innerHTML += "<tr>" +
            "<td>" + participant.id + "</td>" +
            "<td>" + participant.name + "</td>" +
            "<td>" + participant.forename + "</td>" +
            "<td>" + participant.class + "</td>" +
            "<td>" + participant.remarks + "</td>" +
            "<td><button class='delete-btn' data-type='participant' data-id='" + participant.id + "'>Löschen</button></td>" +
        "</tr>";
    }
    
    document.querySelector("#disciplines-con tbody").innerHTML = ""
    for (const discipline of (await getDisciplines())) {
        document.querySelector("#disciplines-con tbody").innerHTML += "<tr>" +
            "<td>" + discipline.id + "</td>" +
            "<td>" + discipline.name + "</td>" +
            "<td>" + discipline.unit + "</td>" +
            "<td>" + (discipline.timer ? "ja" : "nein") + "</td>" +
            "<td><button class='delete-btn' data-type='discipline' data-id='" + discipline.id + "'>Löschen</button></td>" +
        "</tr>";
    }

    document.querySelector("#participants-con select").innerHTML = "";
    for (const clas of (await getClasses())) {
        document.querySelector("#participants-con select").innerHTML += "<option>" + clas.name + "</option>";
    }
    
    assignEventListeners();
}

display()