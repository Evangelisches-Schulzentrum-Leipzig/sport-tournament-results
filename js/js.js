const DB_NAME = "tournament";
const DB_VERSION = 1;

const SYNC_INTERVAL_A = 5000;
const SYNC_TIMEOUT_B = 10000;
const SYNC_RETRY_INTERVAL_C = 2000;

let db;
let syncFlowRunning = false;
let currentDisciplineTimer = false;
let activeTimers = {};
let globalTimerRunning = false;
let currentClassParticipants = [];
let completedParticipants = new Set();
let globalStartTime = null;
let globalTimerInterval = null;

const el = (selector) => document.querySelector(selector);
const elAll = (selector) => document.querySelectorAll(selector);

const toggle = (selector, show) => {
    el(selector).style.display = show ? "" : "none";
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function formatMeasurement(value, unit) {
    if (unit === "s") {
        // Format: 00:00.000 (00000s 000ms)
        const minutes = String(Math.floor(value / 60)).padStart(2, "0");
        const seconds = String(Math.floor(value % 60)).padStart(2, "0");
        const milliseconds = String(Math.floor((value % 1) * 1000)).padStart(3, "0");
        const totalSeconds = String(Math.floor(value)).padStart(1, "0");
        const ms = String(Math.floor((value % 1) * 1000)).padStart(3, "0");
        return `${minutes}:${seconds}.${milliseconds} (${totalSeconds}s ${ms}ms)`;
    } else if (unit === "m") {
        // Format: 00,00m
        return value.toFixed(2).replace(".", ",") + "m";
    } else {
        // Format: 0.000,00u
        const integerPart = String(Math.floor(value)).padStart(1, "0");
        const decimalPart = String(Math.round((value % 1) * 100)).padStart(2, "0");
        return `${integerPart}.000,${decimalPart}${unit}`;
    }
}

function formatTimerDisplay(value, unit) {
    if (unit === "s") {
        // Format: MM:SS.mmm (just the timer part)
        const minutes = String(Math.floor(value / 60)).padStart(2, "0");
        const seconds = String(Math.floor(value % 60)).padStart(2, "0");
        const milliseconds = String(Math.floor((value % 1) * 1000)).padStart(3, "0");
        return `${minutes}:${seconds}.${milliseconds}`;
    } else if (unit === "m") {
        // Format: 00,00
        return value.toFixed(2).replace(".", ",");
    } else {
        // Format: 0.000,00
        const integerPart = String(Math.floor(value)).padStart(1, "0");
        const decimalPart = String(Math.round((value % 1) * 100)).padStart(2, "0");
        return `${integerPart}.000,${decimalPart}`;
    }
}

function getInitialTimerDisplay(unit) {
    if (unit === "s") {
        return "00:00.000";
    } else if (unit === "m") {
        return "00,00";
    } else {
        return "0.000,00";
    }
}

function updateTimerButtonState(participantId) {
    const table = el(`#measurements-table-${participantId}`);
    const startBtn = el(`button.start-timer-btn[data-participant="${participantId}"]`);
    const falseStartBtns = elAll(`button.false-start-btn[data-participant="${participantId}"]`);
    const addBtn = el(`button.add-measurement-btn[data-participant="${participantId}"]`);
    const hasMeasurement = table.children.length > 0;
    
    if (startBtn) {
        if (hasMeasurement) {
            startBtn.disabled = true;
            startBtn.textContent = "Messung erfasst";
        } else if (globalTimerRunning) {
            startBtn.disabled = true;
            startBtn.textContent = "Warten...";
        } else {
            startBtn.disabled = false;
            startBtn.textContent = "Messung starten";
        }
    }
    
    // Update false start buttons
    falseStartBtns.forEach(btn => {
        if (hasMeasurement) {
            btn.disabled = true;
            btn.textContent = "Bereits erfasst";
        } else {
            btn.disabled = false;
            btn.textContent = "Invalid run/false start";
        }
    });
    
    // Update add measurement button
    if (addBtn) {
        if (hasMeasurement || globalTimerRunning) {
            addBtn.disabled = true;
        } else {
            addBtn.disabled = false;
        }
    }
}

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
        // Check for saved selections BEFORE showing disciplines
        const lastDisciplineId = localStorage.getItem("lastDisciplineId");
        const lastClassName = localStorage.getItem("lastClassName");
        
        if (await dbCount("classes") > 0) {
            console.log("DB already populated");
            // If we have saved selections, resume immediately without clearing
            if (lastDisciplineId && lastClassName) {
                await showDiscipline(lastDisciplineId);
                await showClass(lastClassName);
                return;
            } else if (lastDisciplineId) {
                await showDiscipline(lastDisciplineId);
                return;
            }
            // Otherwise show discipline selector
            await showDisciples();
            return;
        }

        const data = await fetchJSON("http://localhost:80/data");
        if (!data) throw new Error("No data from API");

        await Promise.all([
            dbAddItems("classes", data.classes),
            dbAddItems("disciplines", data.disciplines),
            dbAddItems("participants", data.participants)
        ]);

        console.log("Database initialized");
        // If we have saved selections, resume immediately without clearing
        if (lastDisciplineId && lastClassName) {
            await showDiscipline(lastDisciplineId);
            await showClass(lastClassName);
        } else if (lastDisciplineId) {
            await showDiscipline(lastDisciplineId);
        } else {
            // Otherwise show discipline selector
            await showDisciples();
        }
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
        
        // Hide discipline and class views
        toggle("#discipline-con", false);
        toggle("#discipline-selector-con", true);
        toggle("#global-timer-con", false);
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
        localStorage.setItem("currentDisciplineId", discipline.id);
        localStorage.setItem("lastDisciplineId", id);
        localStorage.setItem("currentDisciplineUnit", discipline.unit);
        currentDisciplineTimer = discipline.timer || false;
        localStorage.setItem("currentDisciplineTimer", currentDisciplineTimer);
        await showClasses();
        
        // Attach back button listener after all DOM elements are ready
        await wait(10);
        const backBtn = el("#back-to-disciplines-btn");
        if (backBtn) {
            backBtn.onclick = () => {
                localStorage.removeItem("lastDisciplineId");
                localStorage.removeItem("lastClassName");
                showDisciples();
            };
        }
    } catch (error) {
        console.error("Error loading discipline:", error);
    }
}

async function showClasses() {
    try {
        const classes = await dbGetAll("classes");
        renderItems("#discipline-con #class-selector-con", classes, "name", "name", showClass);
        // Hide global timer when showing class selector
        toggle("#global-timer-con", false);
    } catch (error) {
        console.error("Error loading classes:", error);
    }
}

async function showClass(className) {
    try {
        toggle("#class-selector-con", false);
        toggle("#class-con", true);
        
        // Save the selected class
        localStorage.setItem("lastClassName", className);

        const participants = await dbGetByIndex("participants", "class", className);
        currentClassParticipants = participants;
        completedParticipants.clear();
        
        el("#class-body").innerHTML = "";

        participants.forEach(p => {
            el("#class-body").innerHTML += `<tr>
                <td>${p.id}</td>
                <td>${p.name}</td>
                <td>${p.forename}</td>
                <td>${p.remarks || ""}</td>
                <td class='measurement-actions' data-id='${p.id}'>
                    <table id="measurements-table-${p.id}" style="margin-bottom: 10px;"></table>
                    <!-- Manual Input Section -->
                    <div id="manual-input-section-${p.id}" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px;">
                        <button class="false-start-btn" data-participant="${p.id}">Invalid run/false start</button>
                        <div style="display: flex; gap: 5px;">
                            <input type="number" class="measurement-input" data-participant="${p.id}" placeholder="Messung" step="0.01" min="0">
                            <span class="measurement-unit">${localStorage.getItem("currentDisciplineUnit") || "s"}</span>
                            <button class="add-measurement-btn" data-participant="${p.id}">Hinzufügen</button>
                        </div>
                    </div>
                    <!-- Timer Section -->
                    <div id="timer-section-${p.id}" class="individual-timer-section" style="display: none; flex-direction: column; gap: 8px; margin-bottom: 10px;">
                        <button class="false-start-btn" data-participant="${p.id}">Invalid run/false start</button>
                        <div style="display: flex; flex-direction: column; gap: 5px;">
                            <span class="timer-display" data-participant="${p.id}">${getInitialTimerDisplay(localStorage.getItem("currentDisciplineUnit") || "s")}</span>
                            <button class="start-timer-btn" data-participant="${p.id}">Messung starten</button>
                            <button class="stop-timer-btn" style="display: none;" disabled data-participant="${p.id}">Messung stoppen</button>
                        </div>
                    </div>
                </td>
            </tr>`;
        });

        // Show global timer only if this is a timer-based discipline
        if (currentDisciplineTimer) {
            toggle("#global-timer-con", true);
            attachGlobalTimerListeners();
        } else {
            toggle("#global-timer-con", false);
        }

        attachMeasurementListeners(participants);
        
        // Attach back button listener after all DOM elements are ready
        await wait(10);
        const backBtn = el("#back-to-classes-btn");
        if (backBtn) {
            backBtn.onclick = () => {
                localStorage.removeItem("lastClassName");
                toggle("#class-con", false);
                toggle("#class-selector-con", true);
                toggle("#global-timer-con", false);
            };
        }
    } catch (error) {
        console.error("Error loading class:", error);
    }
}

function attachMeasurementListeners(participants) {
    participants.forEach(p => {
        const participantId = p.id;
        
        // Show/hide sections based on timer flag
        const manualSection = el(`#manual-input-section-${participantId}`);
        const timerSection = el(`#timer-section-${participantId}`);
        
        if (currentDisciplineTimer) {
            if (manualSection) manualSection.style.display = "none";
            if (timerSection) timerSection.style.display = "flex";
        } else {
            if (manualSection) manualSection.style.display = "flex";
            if (timerSection) timerSection.style.display = "none";
        }

        // False start buttons
        const falseStartBtns = elAll(`button.false-start-btn[data-participant="${participantId}"]`);
        falseStartBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                // Disable false start button if measurement already exists
                const table = el(`#measurements-table-${participantId}`);
                if (table.children.length > 0) return;
                addFalseStart(participantId);
            });
        });

        // Manual input section
        const addBtn = el(`button.add-measurement-btn[data-participant="${participantId}"]`);
        const inputField = el(`input.measurement-input[data-participant="${participantId}"]`);
        
        if (addBtn && inputField) {
            addBtn.addEventListener("click", () => {
                // Block if global timer is running or measurement exists
                if (globalTimerRunning) return;
                const table = el(`#measurements-table-${participantId}`);
                if (table.children.length > 0) return;
                
                const value = parseFloat(inputField.value);
                if (!isNaN(value) && value >= 0) {
                    addMeasurement(participantId, value);
                    inputField.value = "";
                }
            });
            
            inputField.addEventListener("keypress", (e) => {
                if (e.key === "Enter" && !globalTimerRunning) {
                    const table = el(`#measurements-table-${participantId}`);
                    if (table.children.length === 0) addBtn.click();
                }
            });
        }

        // Timer buttons
        const startBtn = el(`button.start-timer-btn[data-participant="${participantId}"]`);
        const stopBtn = el(`button.stop-timer-btn[data-participant="${participantId}"]`);
        const timerDisplay = el(`span.timer-display[data-participant="${participantId}"]`);

        if (startBtn && stopBtn && timerDisplay) {
            startBtn.addEventListener("click", () => {
                // Disable individual timer start if measurement already exists
                const table = el(`#measurements-table-${participantId}`);
                if (table.children.length > 0) return;
                startTimer(participantId, timerDisplay, stopBtn, startBtn);
            });
            stopBtn.addEventListener("click", () => stopTimer(participantId, timerDisplay, stopBtn, startBtn));
            
            // Initialize button state
            updateTimerButtonState(participantId);
        }
    });
}

function addFalseStart(participantId) {
    const table = el(`#measurements-table-${participantId}`);
    
    // Check if there's already a measurement for this participant
    if (table.children.length > 0) {
        console.log("Participant already has a measurement");
        return;
    }
    
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>Invalid run/false start</td>
        <td><button class="delete-measurement" data-participant="${participantId}">Löschen</button></td>
    `;
    table.appendChild(row);
    row.querySelector(".delete-measurement").addEventListener("click", () => {
        row.remove();
        completedParticipants.delete(participantId);
        updateTimerButtonState(participantId);
    });
    
    // If global timer is running, stop the individual timer
    if (globalTimerRunning) {
        const stopBtn = el(`button.stop-timer-btn[data-participant="${participantId}"]`);
        const startBtn = el(`button.start-timer-btn[data-participant="${participantId}"]`);
        
        if (stopBtn && stopBtn.style.display !== "none") {
            stopTimer(participantId, el(`span.timer-display[data-participant="${participantId}"]`), stopBtn, startBtn);
        }
    }
    
    // Mark participant as completed and save to DB
    completedParticipants.add(participantId);
    saveMeasurement(participantId, null, "false_start");
    
    // Update button states
    updateTimerButtonState(participantId);
    
    // Check if all participants have recorded measurements
    checkGlobalTimerCompletion();
}

function addMeasurement(participantId, value) {
    // Block measurements if global timer is running
    if (globalTimerRunning) {
        console.log("Cannot add individual measurement while global timer is running");
        return;
    }
    
    const table = el(`#measurements-table-${participantId}`);
    
    // Check if there's already a measurement for this participant
    if (table.children.length > 0) {
        console.log("Participant already has a measurement");
        return;
    }
    
    const row = document.createElement("tr");
    const unit = localStorage.getItem("currentDisciplineUnit") || "s";
    const formattedValue = formatMeasurement(value, unit);
    
    row.innerHTML = `
        <td>${formattedValue}</td>
        <td><button class="delete-measurement" data-participant="${participantId}">Löschen</button></td>
    `;
    table.appendChild(row);
    row.querySelector(".delete-measurement").addEventListener("click", () => {
        row.remove();
        completedParticipants.delete(participantId);
        updateTimerButtonState(participantId);
    });
    
    // Mark participant as completed and save to DB
    completedParticipants.add(participantId);
    saveMeasurement(participantId, value);
    
    // Update button states
    updateTimerButtonState(participantId);
    
    // Check if all participants have recorded measurements
    checkGlobalTimerCompletion();
}

async function saveMeasurement(participantId, value, type = "normal") {
    try {
        const disciplineId = parseInt(localStorage.getItem("currentDisciplineId") || "1");
        const measurement = {
            participant_id: participantId,
            discipline_id: disciplineId,
            value: type === "false_start" ? null : value,
            type: type,
            timestamp: Date.now()
        };
        await dbAddItems("measurements", [measurement]);
    } catch (error) {
        console.error("Error saving measurement:", error);
    }
}

function startTimer(participantId, display, stopBtn, startBtn) {
    // Block starting if global timer is running
    if (globalTimerRunning) {
        return;
    }
    
    startBtn.style.display = "none";
    stopBtn.style.display = "block";
    stopBtn.disabled = false;
    stopBtn.textContent = "Messung stoppen";
    
    const unit = localStorage.getItem("currentDisciplineUnit") || "s";
    const startTime = Date.now();
    activeTimers[participantId] = {
        startTime: startTime,
        interval: setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            display.textContent = formatTimerDisplay(elapsed, unit);
        }, 10)
    };
}

function stopTimer(participantId, display, stopBtn, startBtn) {
    let elapsed;
    
    if (globalTimerRunning) {
        // During global timing, calculate from global start time
        elapsed = (Date.now() - globalStartTime) / 1000;
    } else {
        // Individual timing
        if (activeTimers[participantId]) {
            clearInterval(activeTimers[participantId].interval);
            elapsed = (Date.now() - activeTimers[participantId].startTime) / 1000;
            delete activeTimers[participantId];
        } else {
            return;
        }
    }
    
    stopBtn.style.display = "none";
    startBtn.style.display = "block";
    
    // During global timer, save directly to DB; otherwise use addMeasurement for validation
    if (globalTimerRunning) {
        const table = el(`#measurements-table-${participantId}`);
        
        // Check if already has measurement
        if (table.children.length > 0) {
            return;
        }
        
        // Add to UI and save to DB
        const row = document.createElement("tr");
        const unit = localStorage.getItem("currentDisciplineUnit") || "s";
        const formattedValue = formatMeasurement(elapsed, unit);
        
        row.innerHTML = `
            <td>${formattedValue}</td>
            <td><button class="delete-measurement" data-participant="${participantId}">Löschen</button></td>
        `;
        table.appendChild(row);
        row.querySelector(".delete-measurement").addEventListener("click", () => {
            row.remove();
            completedParticipants.delete(participantId);
        });
        
        completedParticipants.add(participantId);
        saveMeasurement(participantId, elapsed);
        updateTimerButtonState(participantId);
        checkGlobalTimerCompletion();
    } else {
        addMeasurement(participantId, elapsed);
    }
    
    const unit = localStorage.getItem("currentDisciplineUnit") || "s";
    display.textContent = getInitialTimerDisplay(unit);
}

function attachGlobalTimerListeners() {
    const globalStartBtn = el("#global-start-btn");
    const globalStopBtn = el("#global-stop-btn");
    
    globalStartBtn.onclick = startGlobalTimer;
    globalStopBtn.onclick = stopGlobalTimer;
}

function startGlobalTimer() {
    globalTimerRunning = true;
    completedParticipants.clear();
    globalStartTime = Date.now();
    
    el("#global-start-btn").style.display = "none";
    el("#global-stop-btn").style.display = "block";
    
    const globalDisplay = el("#global-timer-display");
    const unit = localStorage.getItem("currentDisciplineUnit") || "s";
    globalDisplay.textContent = getInitialTimerDisplay(unit);
    
    // Show all individual stop buttons and update state
    elAll(".stop-timer-btn").forEach(btn => {
        btn.style.display = "block";
        btn.disabled = false;
        btn.textContent = "Messung stoppen";
    });
    
    elAll(".start-timer-btn").forEach(btn => {
        btn.style.display = "none";
        btn.disabled = true;
        btn.textContent = "Warten...";
    });
    
    globalTimerInterval = setInterval(() => {
        if (!globalTimerRunning) {
            clearInterval(globalTimerInterval);
            return;
        }
        
        const elapsed = (Date.now() - globalStartTime) / 1000;
        const timeStr = formatTimerDisplay(elapsed, unit);
        
        globalDisplay.textContent = timeStr;
        
        // Update all individual timer displays
        elAll(".timer-display").forEach(display => {
            display.textContent = timeStr;
        });
    }, 10);
}

function stopGlobalTimer() {
    globalTimerRunning = false;
    
    if (globalTimerInterval) {
        clearInterval(globalTimerInterval);
    }
    
    el("#global-start-btn").style.display = "block";
    el("#global-stop-btn").style.display = "none";
    
    // Save measurements for all remaining participants
    currentClassParticipants.forEach(p => {
        if (!completedParticipants.has(p.id)) {
            const elapsed = (Date.now() - globalStartTime) / 1000;
            saveMeasurement(p.id, elapsed);
            completedParticipants.add(p.id);
            
            // Add measurement to table
            const table = el(`#measurements-table-${p.id}`);
            const row = document.createElement("tr");
            const unit = localStorage.getItem("currentDisciplineUnit") || "s";
            const formattedValue = formatMeasurement(elapsed, unit);
            
            row.innerHTML = `
                <td>${formattedValue}</td>
                <td><button class="delete-measurement" data-participant="${p.id}">Löschen</button></td>
            `;
            table.appendChild(row);
            row.querySelector(".delete-measurement").addEventListener("click", () => {
                row.remove();
                completedParticipants.delete(p.id);
                updateTimerButtonState(p.id);
            });
        }
    });
    
    // Reset individual stop buttons
    elAll(".stop-timer-btn").forEach(btn => {
        btn.style.display = "none";
        btn.disabled = true;
        btn.textContent = "Messung stoppen";
    });
    
    elAll(".start-timer-btn").forEach(btn => {
        btn.style.display = "block";
        btn.disabled = false;
        btn.textContent = "Messung starten";
        // Update each button's state based on whether measurement exists
        const participantId = btn.getAttribute("data-participant");
        updateTimerButtonState(participantId);
    });
    
    // Reset individual timer displays
    const unit = localStorage.getItem("currentDisciplineUnit") || "s";
    const resetDisplay = getInitialTimerDisplay(unit);
    
    elAll(".timer-display").forEach(display => {
        display.textContent = resetDisplay;
    });
    
    el("#global-timer-display").textContent = resetDisplay;
}

function checkGlobalTimerCompletion() {
    if (!globalTimerRunning) return;
    
    // Check if all participants have completed measurements
    if (completedParticipants.size === currentClassParticipants.length) {
        stopGlobalTimer();
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