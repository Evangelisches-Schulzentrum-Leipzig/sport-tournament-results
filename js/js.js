const DB_NAME = "tournament";
const DB_VERSION = 1;

var db;

function getData() {
    return {
        "classes": [
            {"name": "10a", "level": 10},
            {"name": "10b", "level": 10},
            {"name": "10c", "level": 10},
        ],
        "participants": [
            {"id": 1, "name": "Müller", "forename": "Max", "class": "10a", "remarks": null},
            {"id": 2, "name": "Müller", "forename": "Marie", "class": "10a", "remarks": null},
            {"id": 3, "name": "King", "forename": "Alice", "class": "10b", "remarks": "Isst nur Tomaten"},
            {"id": 4, "name": "von Burg", "forename": "Bob", "class": "10b", "remarks": "Kann nicht springen"},
            {"id": 5, "name": "Conel", "forename": "Craig", "class": "10c", "remarks": null},
        ],
        "disciplines": [
            {"id": 1, "name": "800m Lauf", "unit": "s", "timer": true},
            {"id": 2, "name": "Sprint", "unit": "s", "timer": false},
            {"id": 3, "name": "Weitwurf", "unit": "m", "timer": false},
            {"id": 4, "name": "3-Fach Schritt", "unit": "m", "timer": false},
        ]
    }
}

function openDB() {
    console.log("Openening DB...")
    var req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onsuccess = function (event) {
        db = this.result;
        console.log("Opened DB!");
        showDisciples()
    };
    req.onerror = function (event) {
        console.error("Error while opening DB:", event.target.errorCode);
    };

    req.onupgradeneeded = function (event) {
        console.log("DB Upgrade needed");

        // id, name, forename, class, remarks
        var participantStore = event.currentTarget.result.createObjectStore("participants", { keyPath: 'id' });
        participantStore.createIndex("name", "name", { unique: false });
        participantStore.createIndex("class", "class", { unique: false });

        // name, level
        var classStore = event.currentTarget.result.createObjectStore("classes", { keyPath: 'name' });
        classStore.createIndex("level", "level", { unique: false });

        // id, name, unit, timer
        var disciblineStore = event.currentTarget.result.createObjectStore("disciplines", { keyPath: 'id' });
        disciblineStore.createIndex("name", "name", { unique: false });

        // id, participant, discipline, value, 
        var measurementStore = event.currentTarget.result.createObjectStore("measurements", { keyPath: 'id', autoIncrement: true });
        measurementStore.createIndex("participant", "participant", { unique: false });
        measurementStore.createIndex("discibline", "discibline", { unique: false });
    };
}

function fillDB() {
    var data = getData();
    const transaction = db.transaction(["participants", "classes", "disciplines"], "readwrite");
    transaction.oncomplete = (event) => {
        console.log("All starting Data injested!");
    };

    transaction.onerror = (event) => {
        console.error(event)
    };

    const classStore = transaction.objectStore("classes");
    data.classes.forEach((el) => {
        classStore.add(el)
    })
    const participantStore = transaction.objectStore("participants");
    data.participants.forEach((el) => {
        participantStore.add(el)
    })
    const disciblineStore = transaction.objectStore("disciplines");
    data.disciplines.forEach((el) => {
        disciblineStore.add(el)
    })
}
openDB();

function showDisciples() {
    const transaction = db.transaction(["disciplines"], "readonly");
    transaction.oncomplete = (event) => {
        console.log("Loaded all disciplines!");
    };

    transaction.onerror = (event) => {
        console.error(event)
    };

    const disciblineStore = transaction.objectStore("disciplines");
    disciblineStore.getAll().onsuccess = (response) => {
        response.target.result.forEach(el => {
            document.querySelector("#discipline-selector-con").innerHTML += '<button data-id="' + el.id + '">' + el.name + '</button><br>';
        })
        document.querySelectorAll("#discipline-selector-con button").forEach((el) => {
            el.addEventListener("click", () => {
                showDiscipline(el.dataset.id)
            })
        })
    };
}

function showDiscipline(id) {
    document.querySelector("#discipline-selector-con").style.display = "none";
    document.querySelector("#discipline-con").style.display = "";

    const transaction = db.transaction(["disciplines", "classes"], "readonly");
    transaction.oncomplete = (event) => {
        console.log("Loaded discipline!");
    };

    transaction.onerror = (event) => {
        console.error(event)
    };

    const disciblineStore = transaction.objectStore("disciplines");
    disciblineStore.get(parseInt(id)).onsuccess = (response) => {
        console.log(response.target.result)
        document.querySelector("#discipline-con #discipline-header").innerHTML = response.target.result.name + "<br>";
        localStorage.setItem("currentDiscipline", response.target.result.name);
        showClasses();
    };
}

function showClasses() {
    const transaction = db.transaction(["classes"], "readonly");
    transaction.oncomplete = (event) => {
        console.log("Loaded all classes!");
    };

    transaction.onerror = (event) => {
        console.error(event)
    };

    const classStore = transaction.objectStore("classes");
    classStore.getAll().onsuccess = (response) => {
        response.target.result.forEach(el => {
            document.querySelector("#discipline-con #class-selector-con").innerHTML += '<button data-id="' + el.name + '">' + el.name + '</button><br>';
        })
        document.querySelectorAll("#class-selector-con button").forEach((el) => {
            el.addEventListener("click", () => {
                showClass(el.dataset.id)
            })
        })
    };
}

function showClass(id) {
    document.querySelector("#class-selector-con").style.display = "none";
    document.querySelector("#class-con").style.display = "";

    const transaction = db.transaction(["participants"], "readonly");
    transaction.oncomplete = (event) => {
        console.log("Loaded class!");
    };

    transaction.onerror = (event) => {
        console.error(event)
    };

    const participantStore = transaction.objectStore("participants");
    participantStore.index("class").openCursor(IDBKeyRange.only(id)).onsuccess = (response) => {
        const cursor = event.target.result;
        if (cursor) {
            var participant = cursor.value;
            document.querySelector("#class-body").innerHTML += "<tr><td>" + participant.id + "</td><td>" + participant.name + "</td><td>" + participant.forename + "</td><td>" + (participant.remarks === null ? "" : participant.remarks) + "</td><td class='actions-con' data-id='" + participant.id + "'></td></tr>";
            cursor.continue();
        } else {
            localStorage.setItem("timestamp", (new Date()).getTime() + "." + (new Date()).getMilliseconds())
            document.querySelectorAll(".actions-con").forEach((el) => {
                el.innerHTML += "<button data-id='" + el.dataset.id + "'>Messung stoppen</button>";
                el.querySelector("button").addEventListener("click", (event) => {
                    console.log(((new Date()).getTime() + ((new Date()).getMilliseconds() / 1000)) - (new Date(parseFloat(localStorage.getItem("timestamp"))).getTime()))
                })
            })
        }
    };
}