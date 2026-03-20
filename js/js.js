const DB_NAME = "tournament";
const DB_VERSION = 1;

const SYNC_INTERVAL_A = 5000;
const SYNC_TIMEOUT_B = 10000;
const SYNC_RETRY_INTERVAL_C = 2000;

let db;
let syncFlowRunning = false;

const el = (selector) => document.querySelector(selector);
const elAll = (selector) => document.querySelectorAll(selector);

const toggle = (selector, show) => {
    el(selector).style.display = show ? "" : "none";
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchJSON(url) {
    try {
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${url}:`, error);
        return null;
    }
}

function dbTransaction(stores, mode = "readonly") {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(stores, mode);
        transaction.onerror = () => reject(transaction.error);
        resolve(transaction);
    });
}

async function dbOperation(stores, mode, operation) {
    try {
        const transaction = await dbTransaction(stores, mode);
        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
            operation(transaction);
        });
    } catch (error) {
        console.error("DB operation error:", error);
        throw error;
    }
}

async function dbRead(storeName, operation) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], "readonly");
        transaction.onerror = () => reject(transaction.error);
        const store = transaction.objectStore(storeName);
        const request = operation(store);
        request.onsuccess = () => resolve(request.result);
    });
}

async function dbAddItems(storeName, items) {
    return dbOperation([storeName], "readwrite", (transaction) => {
        const store = transaction.objectStore(storeName);
        items.forEach(item => store.add(item));
    });
}

async function dbClear(storeName) {
    return dbOperation([storeName], "readwrite", (transaction) => {
        transaction.objectStore(storeName).clear();
    });
}

async function dbGetAll(storeName) {
    return dbRead(storeName, (store) => store.getAll());
}

async function dbGet(storeName, key) {
    return dbRead(storeName, (store) => store.get(key));
}

async function dbGetByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], "readonly");
        transaction.onerror = () => reject(transaction.error);
        const store = transaction.objectStore(storeName);
        const results = [];
        const cursor = store.index(indexName).openCursor(IDBKeyRange.only(value));
        cursor.onsuccess = (event) => {
            const cur = event.target.result;
            if (cur) {
                results.push(cur.value);
                cur.continue();
            } else {
                resolve(results);
            }
        };
    });
}

async function dbCount(storeName) {
    return dbRead(storeName, (store) => store.count());
}

function createInitStores(result) {
    const stores = {
        participants: { keyPath: 'id', indices: [['name', false], ['class', false]] },
        classes: { keyPath: 'name', indices: [['level', false]] },
        disciplines: { keyPath: 'id', indices: [['name', false]] },
        measurements: { keyPath: 'id', autoIncrement: true, indices: [['participant', false], ['discibline', false]] }
    };

    Object.entries(stores).forEach(([name, config]) => {
        const store = result.createObjectStore(name, { keyPath: config.keyPath, autoIncrement: config.autoIncrement });
        config.indices?.forEach(([indexName, unique]) => store.createIndex(indexName, indexName, { unique }));
    });
}

function openDB() {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onsuccess = (e) => {
        db = e.target.result;
        fillDB();
    };
    req.onerror = (e) => console.error("DB error:", e.target.errorCode);
    req.onupgradeneeded = (e) => {
        console.log("Creating database...");
        createInitStores(e.currentTarget.result);
    };
}

async function fillDB() {
    try {
        if (await dbCount("classes") > 0) {
            console.log("DB already populated");
            return showDisciples();
        }

        const data = await fetchJSON("http://localhost:80/data");
        if (!data) throw new Error("No data from API");

        await Promise.all([
            dbAddItems("classes", data.classes),
            dbAddItems("disciplines", data.disciplines),
            dbAddItems("participants", data.participants)
        ]);

        console.log("Database initialized");
        await showDisciples();
    } catch (error) {
        console.error("Error filling DB:", error);
    }
}

function createButtonRow(id, name) {
    return `<button data-id="${id}">${name}</button><br>`;
}

async function renderItems(containerId, items, idField, nameField, onClick) {
    el(containerId).innerHTML = "";
    items.forEach(item => {
        el(containerId).innerHTML += createButtonRow(item[idField], item[nameField]);
    });
    
    elAll(`${containerId} button`).forEach(btn => {
        btn.addEventListener("click", () => onClick(btn.dataset.id));
    });
}

async function showDisciples() {
    try {
        const disciplines = await dbGetAll("disciplines");
        renderItems("#discipline-selector-con", disciplines, "id", "name", showDiscipline);
    } catch (error) {
        console.error("Error loading disciplines:", error);
    }
}

async function showDiscipline(id) {
    try {
        toggle("#discipline-selector-con", false);
        toggle("#discipline-con", true);

        const discipline = await dbGet("disciplines", parseInt(id));
        el("#discipline-con #discipline-header").innerHTML = discipline.name + "<br>";
        localStorage.setItem("currentDiscipline", discipline.name);
        await showClasses();
    } catch (error) {
        console.error("Error loading discipline:", error);
    }
}

async function showClasses() {
    try {
        const classes = await dbGetAll("classes");
        renderItems("#discipline-con #class-selector-con", classes, "name", "name", showClass);
    } catch (error) {
        console.error("Error loading classes:", error);
    }
}

async function showClass(className) {
    try {
        toggle("#class-selector-con", false);
        toggle("#class-con", true);

        const participants = await dbGetByIndex("participants", "class", className);
        el("#class-body").innerHTML = "";

        participants.forEach(p => {
            el("#class-body").innerHTML += `<tr>
                <td>${p.id}</td>
                <td>${p.name}</td>
                <td>${p.forename}</td>
                <td>${p.remarks || ""}</td>
                <td class='actions-con' data-id='${p.id}'></td>
            </tr>`;
        });

        const timestamp = Date.now();
        localStorage.setItem("timestamp", timestamp);

        elAll(".actions-con").forEach(el_val => {
            el_val.innerHTML += `<button data-id='${el_val.dataset.id}'>Messung stoppen</button>`;
            el_val.querySelector("button").addEventListener("click", () => {
                console.log(Date.now() - timestamp);
            });
        });
    } catch (error) {
        console.error("Error loading class:", error);
    }
}

async function sync() {
    try {
        const measurements = await dbGetAll("measurements");

        if (!measurements.length) {
            console.log("No measurements to sync");
            return;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), SYNC_TIMEOUT_B);

        const response = await fetch("http://localhost:80/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(measurements),
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) throw new Error(`Sync failed: ${response.statusText}`);

        const data = await response.json();

        await Promise.all([
            dbClear("classes"),
            dbClear("disciplines"),
            dbClear("participants")
        ]);

        await Promise.all([
            data.classes && dbAddItems("classes", data.classes),
            data.disciplines && dbAddItems("disciplines", data.disciplines),
            data.participants && dbAddItems("participants", data.participants)
        ].filter(Boolean));

        await dbClear("measurements");
        console.log("Sync completed");
    } catch (error) {
        console.error("Sync error:", error);
        throw error;
    }
}

async function startSyncFlow() {
    if (syncFlowRunning) return;

    syncFlowRunning = true;

    while (syncFlowRunning) {
        try {
            await sync();
            await wait(SYNC_INTERVAL_A);
        } catch {
            await wait(SYNC_RETRY_INTERVAL_C);
        }
    }
}

const stopSyncFlow = () => {
    syncFlowRunning = false;
};

openDB();