const DB_NAME = "tournament";
const DB_VERSION = 1;

// Sync flow constants (in milliseconds)
const SYNC_INTERVAL_A = 5000;      // Wait time after successful sync
const SYNC_TIMEOUT_B = 10000;       // Timeout for server request
const SYNC_RETRY_INTERVAL_C = 2000; // Wait time after failed sync (offline/timeout)

var db;
var syncFlowRunning = false;

function getData() {
    return fetch("http://localhost:80/data")
        .then(response => response.json())
        .catch(error => {
            console.error("Error fetching data from API:", error);
            return {
                "classes": [],
                "participants": [],
                "disciplines": []
            };
        });
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

function sync() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["measurements"], "readonly");
        transaction.oncomplete = (event) => {
            console.log("Sync transaction completed!");
        };

        transaction.onerror = (event) => {
            console.error("Transaction error:", event);
            reject(event);
        };

        const measurementStore = transaction.objectStore("measurements");
        measurementStore.getAll().onsuccess = async (event) => {
            const measurements = event.target.result;
            
            if (measurements.length === 0) {
                console.log("No measurements to sync");
                resolve();
                return;
            }
            
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), SYNC_TIMEOUT_B);
                
                const response = await fetch("http://localhost:80/sync", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(measurements),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    console.error("Sync failed:", response.statusText);
                    reject(new Error(`Sync failed: ${response.statusText}`));
                    return;
                }
                
                const data = await response.json();
                await updateDB(data);
                await deleteMeasurements();
                resolve();
            } catch (error) {
                console.error("Error syncing:", error);
                reject(error);
            }
        };
    });
}

function updateDB(data) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["classes", "disciplines", "participants"], "readwrite");
        transaction.oncomplete = (event) => {
            console.log("Database updated after sync!");
            resolve();
        };

        transaction.onerror = (event) => {
            console.error("Error updating DB:", event);
            reject(event);
        };

        // Clear and update classes
        const classStore = transaction.objectStore("classes");
        classStore.clear().onsuccess = () => {
            if (data.classes) {
                data.classes.forEach((el) => {
                    classStore.add(el);
                });
            }
        };

        // Clear and update disciplines
        const disciplineStore = transaction.objectStore("disciplines");
        disciplineStore.clear().onsuccess = () => {
            if (data.disciplines) {
                data.disciplines.forEach((el) => {
                    disciplineStore.add(el);
                });
            }
        };

        // Clear and update participants
        const participantStore = transaction.objectStore("participants");
        participantStore.clear().onsuccess = () => {
            if (data.participants) {
                data.participants.forEach((el) => {
                    participantStore.add(el);
                });
            }
        };
    });
}

function deleteMeasurements() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["measurements"], "readwrite");
        transaction.oncomplete = (event) => {
            console.log("All measurements deleted after sync!");
            resolve();
        };

        transaction.onerror = (event) => {
            console.error("Error deleting measurements:", event);
            reject(event);
        };

        const measurementStore = transaction.objectStore("measurements");
        measurementStore.clear();
    });
}

async function startSyncFlow() {
    if (syncFlowRunning) {
        console.log("Sync flow already running");
        return;
    }
    
    syncFlowRunning = true;
    console.log("Starting sync flow...");
    
    while (syncFlowRunning) {
        try {
            await sync();
            console.log("Sync successful, waiting", SYNC_INTERVAL_A, "ms before next sync");
            await new Promise(resolve => setTimeout(resolve, SYNC_INTERVAL_A));
        } catch (error) {
            console.error("Sync failed (offline or timeout):", error.message);
            console.log("Waiting", SYNC_RETRY_INTERVAL_C, "ms before retry...");
            await new Promise(resolve => setTimeout(resolve, SYNC_RETRY_INTERVAL_C));
        }
    }
}

function stopSyncFlow() {
    syncFlowRunning = false;
    console.log("Sync flow stopped");
}