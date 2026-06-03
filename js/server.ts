import { createPool } from 'mariadb';
import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

config();

const pool = createPool({
    host: process.env['DB_HOST'] ?? '',
    port: Number(process.env['DB_PORT'] ?? 3306),
    user: process.env['DB_USER'] ?? '',
    password: process.env['DB_PASSWORD'] ?? '',
    database: process.env['DB_NAME'] ?? 'timetable',
    compress: true
});

const app = express()
const port = process.env['API_PORT'] || 80;

// Track all WebSocket connections
const connections = new Set<any>();

app.use(cors())
app.use(express.json())

app.get('/status', (req, res) => {
    res.json({ status: 'ok' });
});

app.get('/data', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {
            const searchParams = req.query;
            
            // Classes query with optional search
            let classQuery = "SELECT name, level FROM classes WHERE 1=1";
            const classParams: any[] = [];
            if (searchParams['classQ']) {
                classQuery += ` AND name LIKE ?`;
                classParams.push(`%${searchParams['classQ']}%`);
            }
            classQuery += ";";
            const classRows = await conn.query(classQuery, classParams);
            var classes = (Array.isArray(classRows) ? (classRows as {name: string, level: number}[]) : []);

            // Disciplines query with optional search
            let disciplineQuery = "SELECT id, name, unit, attempts, timer FROM disciplines WHERE 1=1";
            const disciplineParams: any[] = [];
            if (searchParams['disciplineQ']) {
                disciplineQuery += ` AND name LIKE ?`;
                disciplineParams.push(`%${searchParams['disciplineQ']}%`);
            }
            disciplineQuery += ";";
            const disciplineRows = await conn.query(disciplineQuery, disciplineParams);
            var disciplines = (Array.isArray(disciplineRows) ? (disciplineRows as {id: number, name: string, unit: string, attempts: number, timer: boolean}[]) : []);

            // Participants query with filters
            let participantQuery = "SELECT id, name, forename, gender, class_name AS class FROM participants WHERE 1=1";
            const participantParams: any[] = [];
            if (searchParams['class']) {
                const classFilter = Array.isArray(searchParams['class']) ? searchParams['class'] : [searchParams['class']];
                const placeholders = classFilter.map(() => '?').join(',');
                participantQuery += ` AND class_name IN (${placeholders})`;
                participantParams.push(...classFilter);
            }
            if (searchParams['q']) {
                participantQuery += ` AND (name LIKE ? OR forename LIKE ?)`;
                const searchTerm = `%${searchParams['q']}%`;
                participantParams.push(searchTerm, searchTerm);
            }
            participantQuery += ";";
            const participantRows = await conn.query(participantQuery, participantParams);
            var participants = (Array.isArray(participantRows) ? (participantRows as {id: number, name: string, forename: string, gender: string, class: string}[]) : []);

            // Measurements query with optional filters
            let measurementQuery = "SELECT id, participant_id, discipline_id, attempt_number, value, created_at FROM measurements WHERE 1=1";
            const measurementParams: any[] = [];
            if (searchParams['participant_id']) {
                const participantFilter = Array.isArray(searchParams['participant_id']) ? searchParams['participant_id'] : [searchParams['participant_id']];
                const placeholders = participantFilter.map(() => '?').join(',');
                measurementQuery += ` AND participant_id IN (${placeholders})`;
                measurementParams.push(...participantFilter);
            }
            if (searchParams['discipline_id']) {
                const disciplineFilter = Array.isArray(searchParams['discipline_id']) ? searchParams['discipline_id'] : [searchParams['discipline_id']];
                const placeholders = disciplineFilter.map(() => '?').join(',');
                measurementQuery += ` AND discipline_id IN (${placeholders})`;
                measurementParams.push(...disciplineFilter);
            }
            measurementQuery += ` GROUP BY participant_id, discipline_id, attempt_number, value;`;
            const measurementRows = await conn.query(measurementQuery, measurementParams);
            var measurements = (Array.isArray(measurementRows) ? (measurementRows as {id: number, participant_id: number, discipline_id: number, attempt_number: number, value: number, created_at: string}[]) : []);

            // Mark ranges query
            const markRangeQuery = "SELECT discipline_id, class_level, gender, mark, min_value FROM `mark-ranges` ORDER BY discipline_id, class_level, gender, mark;";
            const markRangeRows = await conn.query(markRangeQuery);
            var markRanges = (Array.isArray(markRangeRows) ? (markRangeRows as {discipline_id: number, class_level: number, gender: string, mark: number, min_value: number}[]) : []);

            res.json({
                classes: classes,
                disciplines: disciplines,
                participants: participants,
                measurements: measurements,
                markRanges: markRanges
            });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error((error as Error).message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/classes', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {
            const searchParams = req.query;
            let query = "SELECT name, level FROM classes WHERE 1=1";
            const params: any[] = [];
            
            // Search by class name
            if (searchParams['q']) {
                query += ` AND name LIKE ?`;
                params.push(`%${searchParams['q']}%`);
            }
            
            // Filter by level (support multiple levels)
            if (searchParams['level']) {
                const levelFilter = Array.isArray(searchParams['level']) ? searchParams['level'] : [searchParams['level']];
                const placeholders = levelFilter.map(() => '?').join(',');
                query += ` AND level IN (${placeholders})`;
                params.push(...levelFilter);
            }
            
            query += ";";
            const classRows = await conn.query(query, params);
            var classes = (Array.isArray(classRows) ? (classRows as {name: string, level: number}[]) : []);
            res.json(classes);
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error((error as Error).message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/classes', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {
            const { name, level } = req.body;
            await conn.query("INSERT INTO classes (name, level) VALUES (?, ?) ON DUPLICATE KEY UPDATE level = VALUES(level);", [name, level]);

            const classRows = await conn.query("SELECT name, level FROM classes;");
            var classes = (Array.isArray(classRows) ? (classRows as {name: string, level: number}[]) : []);
            res.json(classes);
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error((error as Error).message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.patch('/classes/:name', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {
            const { name } = req.params;
            const { level } = req.body;
            await conn.query("UPDATE classes SET level = ? WHERE name = ?;", [level, name]);
            const classRows = await conn.query("SELECT name, level FROM classes;");
            var classes = (Array.isArray(classRows) ? (classRows as {name: string, level: number}[]) : []);
            res.json(classes);
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error((error as Error).message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.delete('/classes/:name', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {
            const { name } = req.params;
            await conn.query("DELETE FROM classes WHERE name = ?;", [name]);

            const classRows = await conn.query("SELECT name, level FROM classes;");
            var classes = (Array.isArray(classRows) ? (classRows as {name: string, level: number}[]) : []);
            res.json(classes);
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error((error as Error).message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/participants', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {
            const searchParams = req.query;

            let query = "SELECT id, name, forename, gender, class_name AS class FROM participants WHERE 1=1";
            const params: any[] = [];
            
            // Apply class filter
            if (searchParams['class']) {
                const classFilter = Array.isArray(searchParams['class']) ? searchParams['class'] : [searchParams['class']];
                const placeholders = classFilter.map(() => '?').join(',');
                query += ` AND class_name IN (${placeholders})`;
                params.push(...classFilter);
            }
            
            // Apply search filter
            if (searchParams['q']) {
                query += ` AND (name LIKE ? OR forename LIKE ?)`;
                const searchTerm = `%${searchParams['q']}%`;
                params.push(searchTerm, searchTerm);
            }
            
            query += ";";
            
            const participantRows = await conn.query(query, params);
            var participants = (Array.isArray(participantRows) ? (participantRows as {id: number, name: string, forename: string, gender: string, class: string}[]) : []);
            res.json(participants);
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error((error as Error).message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/participants', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {
            const { name, forename, gender, class: className } = req.body;
            await conn.query("INSERT INTO participants (name, forename, gender, class_name) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), forename = VALUES(forename), gender = VALUES(gender), class_name = VALUES(class_name);", [name, forename, gender, className]);

            const participantRows = await conn.query("SELECT id, name, forename, gender, class_name AS class FROM participants;");
            var participants = (Array.isArray(participantRows) ? (participantRows as {id: number, name: string, forename: string, gender: string, class: string}[]) : []);
            res.json(participants);
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error((error as Error).message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.patch('/participants/:id', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {
            const { id } = req.params;
            const { name, forename, gender, class: className } = req.body;
            await conn.query("UPDATE participants SET name = ?, forename = ?, gender = ?, class_name = ? WHERE id = ?;", [name, forename, gender, className, id]);
            const participantRows = await conn.query("SELECT id, name, forename, gender, class_name AS class FROM participants;");
            var participants = (Array.isArray(participantRows) ? (participantRows as {id: number, name: string, forename: string, gender: string, class: string}[]) : []);
            res.json(participants);
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error((error as Error).message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.delete('/participants/:id', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {
            const { id } = req.params;
            await conn.query("DELETE FROM participants WHERE id = ?;", [id]);

            const participantRows = await conn.query("SELECT id, name, forename, gender, class_name AS class FROM participants;");
            var participants = (Array.isArray(participantRows) ? (participantRows as {id: number, name: string, forename: string, gender: string, class: string}[]) : []);
            res.json(participants);
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error((error as Error).message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/disciplines', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {
            const searchParams = req.query;
            let query = "SELECT id, name, unit, attempts, timer FROM disciplines WHERE 1=1";
            const params: any[] = [];
            
            // Search by discipline name
            if (searchParams['q']) {
                query += ` AND name LIKE ?`;
                params.push(`%${searchParams['q']}%`);
            }
            
            // Filter by unit (support multiple units)
            if (searchParams['unit']) {
                const unitFilter = Array.isArray(searchParams['unit']) ? searchParams['unit'] : [searchParams['unit']];
                const placeholders = unitFilter.map(() => '?').join(',');
                query += ` AND unit IN (${placeholders})`;
                params.push(...unitFilter);
            }
            
            query += ";";
            const disciplineRows = await conn.query(query, params);
            var disciplines = (Array.isArray(disciplineRows) ? (disciplineRows as {id: number, name: string, unit: string, attempts: number, timer: boolean}[]) : []);
            res.json(disciplines);
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error((error as Error).message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/disciplines', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {
            const { name, unit, attempts, timer } = req.body;
            await conn.query("INSERT INTO disciplines (name, unit, attempts, timer) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE unit = VALUES(unit), attempts = VALUES(attempts), timer = VALUES(timer);", [name, unit, attempts, timer]);

            const disciplineRows = await conn.query("SELECT id, name, unit, attempts, timer FROM disciplines;");
            var disciplines = (Array.isArray(disciplineRows) ? (disciplineRows as {id: number, name: string, unit: string, attempts: number, timer: boolean}[]) : []);
            res.json(disciplines);
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error((error as Error).message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.patch('/disciplines/:id', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {
            const { id } = req.params;
            const { name, unit, attempts, timer } = req.body;
            await conn.query("UPDATE disciplines SET name = ?, unit = ?, attempts = ?, timer = ? WHERE id = ?;", [name, unit, attempts, timer, id]);
            const disciplineRows = await conn.query("SELECT id, name, unit, attempts, timer FROM disciplines;");
            var disciplines = (Array.isArray(disciplineRows) ? (disciplineRows as {id: number, name: string, unit: string, attempts: number, timer: boolean}[]) : []);
            res.json(disciplines);
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error((error as Error).message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.delete('/disciplines/:id', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {
            const { id } = req.params;
            await conn.query("DELETE FROM disciplines WHERE id = ?;", [id]);

            const disciplineRows = await conn.query("SELECT id, name, unit, attempts, timer FROM disciplines;");
            var disciplines = (Array.isArray(disciplineRows) ? (disciplineRows as {id: number, name: string, unit: string, attempts: number, timer: boolean}[]) : []);
            res.json(disciplines);
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error((error as Error).message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/mark-ranges', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {
            const searchParams = req.query;
            let query = "SELECT discipline_id, class_level, gender, mark, min_value FROM `mark-ranges` WHERE 1=1";
            const params: any[] = [];
            
            // Filter by discipline (support multiple disciplines)
            if (searchParams['discipline_id']) {
                const disciplineFilter = Array.isArray(searchParams['discipline_id']) ? searchParams['discipline_id'] : [searchParams['discipline_id']];
                const placeholders = disciplineFilter.map(() => '?').join(',');
                query += ` AND discipline_id IN (${placeholders})`;
                params.push(...disciplineFilter);
            }

            // Filter by class level (support multiple class levels)
            if (searchParams['class_level']) {
                const classLevelFilter = Array.isArray(searchParams['class_level']) ? searchParams['class_level'] : [searchParams['class_level']];
                const placeholders = classLevelFilter.map(() => '?').join(',');
                query += ` AND class_level IN (${placeholders})`;
                params.push(...classLevelFilter);
            }

            // Filter by gender (support multiple genders)
            if (searchParams['gender']) {
                const genderFilter = Array.isArray(searchParams['gender']) ? searchParams['gender'] : [searchParams['gender']];
                const placeholders = genderFilter.map(() => '?').join(',');
                query += ` AND gender IN (${placeholders})`;
                params.push(...genderFilter);
            }

            // Filter by mark (support multiple marks)
            if (searchParams['mark']) {
                const markFilter = Array.isArray(searchParams['mark']) ? searchParams['mark'] : [searchParams['mark']];
                const placeholders = markFilter.map(() => '?').join(',');
                query += ` AND mark IN (${placeholders})`;
                params.push(...markFilter);
            }
            
            query += ";";
            const markRangeRows = await conn.query(query, params);
            var markRanges = (Array.isArray(markRangeRows) ? (markRangeRows as {discipline_id: number, class_level: number, gender: string, mark: string, min_value: number}[]) : []);
            res.json(markRanges);
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error((error as Error).message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/mark-ranges', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {
            const { discipline_id, class_level, gender, mark, min_value } = req.body;
            await conn.query("INSERT INTO `mark-ranges` (discipline_id, class_level, gender, mark, min_value) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE min_value = VALUES(min_value);", [discipline_id, class_level, gender, mark, min_value]);
            res.status(200).send();
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error((error as Error).message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.patch('/mark-ranges/:discipline_id/:mark', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {            
            const { discipline_id, mark } = req.params;
            const { class_level, gender, min_value } = req.body;
            await conn.query("UPDATE `mark-ranges` SET class_level = ?, gender = ?, min_value = ? WHERE discipline_id = ? AND mark = ?;", [class_level, gender, min_value, discipline_id, mark]);
            res.status(200).send();
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error((error as Error).message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.delete('/mark-ranges/:discipline_id', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {
            const { discipline_id } = req.params;
            await conn.query("DELETE FROM `mark-ranges` WHERE discipline_id = ?;", [discipline_id]);
            res.status(200).send();
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error((error as Error).message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.delete('/mark-ranges/:discipline_id/:mark', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {
            const { discipline_id, mark } = req.params;
            await conn.query("DELETE FROM `mark-ranges` WHERE discipline_id = ? AND mark = ?;", [discipline_id, mark]);
            res.status(200).send();
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error((error as Error).message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/measurements', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {
            const searchParams = req.query;
            let query = "SELECT id, participant_id, discipline_id, attempt_number, value, created_at FROM measurements WHERE 1=1";
            const params: any[] = [];
            
            // Filter by participant (support multiple participants)
            if (searchParams['participant_id']) {
                const participantFilter = Array.isArray(searchParams['participant_id']) ? searchParams['participant_id'] : [searchParams['participant_id']];
                const placeholders = participantFilter.map(() => '?').join(',');
                query += ` AND participant_id IN (${placeholders})`;
                params.push(...participantFilter);
            }
            
            // Filter by discipline (support multiple disciplines)
            if (searchParams['discipline_id']) {
                const disciplineFilter = Array.isArray(searchParams['discipline_id']) ? searchParams['discipline_id'] : [searchParams['discipline_id']];
                const placeholders = disciplineFilter.map(() => '?').join(',');
                query += ` AND discipline_id IN (${placeholders})`;
                params.push(...disciplineFilter);
            }
            
            // Filter by attempt number (support multiple attempts)
            if (searchParams['attempt_number']) {
                const attemptFilter = Array.isArray(searchParams['attempt_number']) ? searchParams['attempt_number'] : [searchParams['attempt_number']];
                const placeholders = attemptFilter.map(() => '?').join(',');
                query += ` AND attempt_number IN (${placeholders})`;
                params.push(...attemptFilter);
            }
            
            query += ` GROUP BY participant_id, discipline_id, attempt_number, value;`;
            const measurementRows = await conn.query(query, params);
            var measurements = (Array.isArray(measurementRows) ? (measurementRows as {id: number, participant_id: number, discipline_id: number, attempt_number: number, value: number, created_at: string}[]) : []);
            res.json(measurements);
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error((error as Error).message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/measurements', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {
            if (Array.isArray(req.body)) {
                for (const item of req.body) {
                    const { participant_id, discipline_id, attempt_number, value, created_at } = item;
                    var result = await conn.query("SELECT * FROM measurements WHERE participant_id = ? AND discipline_id = ? AND attempt_number = ? AND value = ? LIMIT 1;", [participant_id, discipline_id, attempt_number, value]);
                    if (!Array.isArray(result) || result.length === 0) {
                        await conn.query("INSERT INTO measurements (participant_id, discipline_id, attempt_number, value, created_at) VALUES (?, ?, ?, ?, ?);", [participant_id, discipline_id, attempt_number, value, created_at]);
                    }
                    // TODO: handle element with same participant_id, discipline_id and attempt_number but different value and maybe diffrent created_at
                }
            } else {
                const { participant_id, discipline_id, attempt_number, value, created_at } = req.body;
                var result = await conn.query("SELECT * FROM measurements WHERE participant_id = ? AND discipline_id = ? AND attempt_number = ? AND value = ? LIMIT 1;", [participant_id, discipline_id, attempt_number, value]);
                if (!Array.isArray(result) || result.length === 0) {
                    await conn.query("INSERT INTO measurements (participant_id, discipline_id, attempt_number, value, created_at) VALUES (?, ?, ?, ?, ?);", [participant_id, discipline_id, attempt_number, value, created_at]);
                }            
            }
            res.status(200).send();
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error((error as Error).message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

app.delete('/measurements/:id', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {
            const { id } = req.params;
            await conn.query("DELETE FROM measurements WHERE id = ?;", [id]);
            res.status(200).send();
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error((error as Error).message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/measurements/conflicts', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {
            const searchParams = req.query;
            // Get measurements with same participant_id, discipline_id and attempt_number but different value or created_at
            // Respond with conflicts of same participant, discipline and attempt_number in one array and other conflicts in another [[{id, participant_id, discipline_id, attempt_number, value, created_at}, {id, participant_id, discipline_id, attempt_number, value, created_at}], [...], ...]
            let query = "SELECT id, participant_id, discipline_id, attempt_number, value, created_at FROM measurements WHERE 1=1";
            const params: any[] = [];
            
            // Filter by participant (support multiple participants)
            if (searchParams['participant_id']) {
                const participantFilter = Array.isArray(searchParams['participant_id']) ? searchParams['participant_id'] : [searchParams['participant_id']];
                const placeholders = participantFilter.map(() => '?').join(',');
                query += ` AND participant_id IN (${placeholders})`;
                params.push(...participantFilter);
            }
            
            // Filter by discipline (support multiple disciplines)
            if (searchParams['discipline_id']) {
                const disciplineFilter = Array.isArray(searchParams['discipline_id']) ? searchParams['discipline_id'] : [searchParams['discipline_id']];
                const placeholders = disciplineFilter.map(() => '?').join(',');
                query += ` AND discipline_id IN (${placeholders})`;
                params.push(...disciplineFilter);
            }
            
            query += ` ORDER BY participant_id, discipline_id, attempt_number;`;
            const measurementRows = await conn.query(query, params);
            var measurements = (Array.isArray(measurementRows) ? (measurementRows as {id: number, participant_id: number, discipline_id: number, attempt_number: number, value: number, created_at: string}[]) : []);
            
            // Group measurements by participant_id, discipline_id, and attempt_number
            // Return only groups with conflicts (more than 1 measurement)
            const conflictMap = new Map<string, typeof measurements>();
            
            for (const measurement of measurements) {
                const key = `${measurement.participant_id}_${measurement.discipline_id}_${measurement.attempt_number}`;
                if (!conflictMap.has(key)) {
                    conflictMap.set(key, []);
                }
                conflictMap.get(key)!.push(measurement);
            }
            
            // Filter to only include groups with conflicts and convert to array of arrays
            const conflicts = Array.from(conflictMap.values()).filter(group => group.length > 1);
            
            res.json(conflicts);
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error((error as Error).message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/sync', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {
            if (Array.isArray(req.body)) {
                for (const item of req.body) {
                    const { participant_id, discipline_id, attempt_number, value, created_at } = item;
                    var result = await conn.query("SELECT * FROM measurements WHERE participant_id = ? AND discipline_id = ? AND attempt_number = ? AND value = ? LIMIT 1;", [participant_id, discipline_id, attempt_number, value]);
                    if (!Array.isArray(result) || result.length === 0) {
                        await conn.query("INSERT INTO measurements (participant_id, discipline_id, attempt_number, value, created_at) VALUES (?, ?, ?, ?, ?);", [participant_id, discipline_id, attempt_number, value, created_at]);
                    }                
                }
            } else {
                const { participant_id, discipline_id, attempt_number, value, created_at } = req.body;
                var result = await conn.query("SELECT * FROM measurements WHERE participant_id = ? AND discipline_id = ? AND attempt_number = ? AND value = ? LIMIT 1;", [participant_id, discipline_id, attempt_number, value]);
                if (!Array.isArray(result) || result.length === 0) {
                    await conn.query("INSERT INTO measurements (participant_id, discipline_id, attempt_number, value, created_at) VALUES (?, ?, ?, ?, ?);", [participant_id, discipline_id, attempt_number, value, created_at]);
                }            
            }

            // Give current data
            const classRows = await conn.query("SELECT name, level FROM classes;");
            var classes = (Array.isArray(classRows) ? (classRows as {name: string, level: number}[]) : []);
            const disciplineRows = await conn.query("SELECT id, name, unit, attempts, timer FROM disciplines;");
            var disciplines = (Array.isArray(disciplineRows) ? (disciplineRows as {id: number, name: string, unit: string, attempts: number, timer: boolean}[]) : []);
            const participantRows = await conn.query("SELECT id, name, forename, class_name AS class FROM participants;");
            var participants = (Array.isArray(participantRows) ? (participantRows as {id: number, name: string, forename: string, class: string}[]) : []);
            const measurementRows = await conn.query("SELECT id, participant_id, discipline_id, attempt_number, value, created_at FROM measurements GROUP BY participant_id, discipline_id, attempt_number, value;");
            var measurements = (Array.isArray(measurementRows) ? (measurementRows as {id: number, participant_id: number, discipline_id: number, attempt_number: number, value: number, created_at: string}[]) : []);

            res.json({
                classes: classes,
                disciplines: disciplines,
                participants: participants,
                measurements: measurements
            });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error((error as Error).message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

// Create HTTP server for WebSocket upgrade
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ 
  server,
  path: '/ws'
});

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  
  // Add connection to the set
  connections.add(ws);
  
  // Handle incoming messages
  ws.on('message', (data) => {
    console.log('Received message:', data.toString());
    
    // Broadcast to all connected clients
    const message = {
      type: 'message',
      data: data.toString(),
      timestamp: new Date().toISOString()
    };
    
    broadcastToAll(JSON.stringify(message));
  });
  
  // Handle connection close
  ws.on('close', () => {
    console.log('Client disconnected');
    connections.delete(ws);
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
  
  // Send welcome message to new client
  const welcomeMessage = {
    type: 'connect',
    message: 'Connected to WebSocket server',
    connectedClients: connections.size,
    timestamp: new Date().toISOString()
  };
  ws.send(JSON.stringify(welcomeMessage));
});

// Broadcast message to all connected clients
function broadcastToAll(message: string) {
  connections.forEach((client) => {
    if (client.readyState === 1) { // OPEN state
      client.send(message);
    }
  });
}

// Start the server
server.listen(port, () => {
  console.log(`app listening on port ${port}`)
})