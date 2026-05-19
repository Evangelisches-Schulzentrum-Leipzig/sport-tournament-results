import { createPool } from 'mariadb';
import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';

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

app.use(cors())
app.use(express.json())

app.get('/status', (req, res) => {
    res.json({ status: 'ok' });
});

app.get('/data', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {
            const classRows = await conn.query("SELECT name, level FROM classes;");
            var classes = (Array.isArray(classRows) ? (classRows as {name: string, level: number}[]) : []);

            const disciplineRows = await conn.query("SELECT id, name, unit, attempts, timer FROM disciplines;");
            var disciplines = (Array.isArray(disciplineRows) ? (disciplineRows as {id: number, name: string, unit: string, attempts: number, timer: boolean}[]) : []);

            const participantRows = await conn.query("SELECT id, name, forename, class_name AS class FROM participants;");
            var participants = (Array.isArray(participantRows) ? (participantRows as {id: number, name: string, forename: string, class: string}[]) : []);

            res.json({
                classes: classes,
                disciplines: disciplines,
                participants: participants
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

app.post('/classes', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {
            const { name, level } = req.body;
            await conn.query("INSERT INTO classes (name, level) VALUES (?, ?);", [name, level]);

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
            const participantRows = await conn.query("SELECT id, name, forename, class_name AS class FROM participants;");
            var participants = (Array.isArray(participantRows) ? (participantRows as {id: number, name: string, forename: string, class: string}[]) : []);
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
            const { name, forename, class: className } = req.body;
            await conn.query("INSERT INTO participants (name, forename, class_name) VALUES (?, ?, ?);", [name, forename, className]);

            const participantRows = await conn.query("SELECT id, name, forename, class_name AS class FROM participants;");
            var participants = (Array.isArray(participantRows) ? (participantRows as {id: number, name: string, forename: string, class: string}[]) : []);
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

            const participantRows = await conn.query("SELECT id, name, forename, class_name AS class FROM participants;");
            var participants = (Array.isArray(participantRows) ? (participantRows as {id: number, name: string, forename: string, class: string}[]) : []);
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

app.post('/disciplines', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {
            const { name, unit, attempts, timer } = req.body;
            await conn.query("INSERT INTO disciplines (name, unit, attempts, timer) VALUES (?, ?, ?, ?);", [name, unit, attempts, timer]);

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

            res.json({
                classes: classes,
                disciplines: disciplines,
                participants: participants
            });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error((error as Error).message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

app.listen(port, () => {
  console.log(`app listening on port ${port}`)
})