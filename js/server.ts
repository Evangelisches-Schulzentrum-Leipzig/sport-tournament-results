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

app.get('/data', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {
            const classRows = await conn.query("SELECT name, level FROM classes;");
            var classes = (Array.isArray(classRows) ? (classRows as {name: string, level: number}[]) : []);

            const disciplineRows = await conn.query("SELECT id, name, unit, timer FROM disciplines;");
            var disciplines = (Array.isArray(disciplineRows) ? (disciplineRows as {id: number, name: string, unit: string, timer: boolean}[]) : []);

            const participantRows = await conn.query("SELECT id, name, forename, class_name AS class, remarks FROM participants;");
            var participants = (Array.isArray(participantRows) ? (participantRows as {id: number, name: string, forename: string, class: string, remarks: string}[]) : []);

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
            const participantRows = await conn.query("SELECT id, name, forename, class_name AS class, remarks FROM participants;");
            var participants = (Array.isArray(participantRows) ? (participantRows as {id: number, name: string, forename: string, class: string, remarks: string}[]) : []);
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
            const { name, forename, class: className, remarks } = req.body;
            await conn.query("INSERT INTO participants (name, forename, class_name, remarks) VALUES (?, ?, ?, ?);", [name, forename, className, remarks]);

            const participantRows = await conn.query("SELECT id, name, forename, class_name AS class, remarks FROM participants;");
            var participants = (Array.isArray(participantRows) ? (participantRows as {id: number, name: string, forename: string, class: string, remarks: string}[]) : []);
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

            const participantRows = await conn.query("SELECT id, name, forename, class_name AS class, remarks FROM participants;");
            var participants = (Array.isArray(participantRows) ? (participantRows as {id: number, name: string, forename: string, class: string, remarks: string}[]) : []);
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
            const disciplineRows = await conn.query("SELECT id, name, unit, timer FROM disciplines;");
            var disciplines = (Array.isArray(disciplineRows) ? (disciplineRows as {id: number, name: string, unit: string, timer: boolean}[]) : []);
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
            const { name, unit, timer } = req.body;
            await conn.query("INSERT INTO disciplines (name, unit, timer) VALUES (?, ?, ?);", [name, unit, timer]);

            const disciplineRows = await conn.query("SELECT id, name, unit, timer FROM disciplines;");
            var disciplines = (Array.isArray(disciplineRows) ? (disciplineRows as {id: number, name: string, unit: string, timer: boolean}[]) : []);
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

            const disciplineRows = await conn.query("SELECT id, name, unit, timer FROM disciplines;");
            var disciplines = (Array.isArray(disciplineRows) ? (disciplineRows as {id: number, name: string, unit: string, timer: boolean}[]) : []);
            res.json(disciplines);
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error((error as Error).message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/meassurements', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {
            if (Array.isArray(req.body)) {
                for (const item of req.body) {
                    const { participantId, disciplineId, value } = item;
                    await conn.query("INSERT INTO meassurements (participant_id, discipline_id, value) VALUES (?, ?, ?);", [participantId, disciplineId, value]);
                }
            } else {
                const { participantId, disciplineId, value } = req.body;
                await conn.query("INSERT INTO meassurements (participant_id, discipline_id, value) VALUES (?, ?, ?);", [participantId, disciplineId, value]);
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
                    const { participantId, disciplineId, value } = item;
                    await conn.query("INSERT INTO meassurements (participant_id, discipline_id, value) VALUES (?, ?, ?);", [participantId, disciplineId, value]);
                }
            } else {
                const { participantId, disciplineId, value } = req.body;
                await conn.query("INSERT INTO meassurements (participant_id, discipline_id, value) VALUES (?, ?, ?);", [participantId, disciplineId, value]);
            }

            // Give current data
            const classRows = await conn.query("SELECT name, level FROM classes;");
            var classes = (Array.isArray(classRows) ? (classRows as {name: string, level: number}[]) : []);
            const disciplineRows = await conn.query("SELECT id, name, unit, timer FROM disciplines;");
            var disciplines = (Array.isArray(disciplineRows) ? (disciplineRows as {id: number, name: string, unit: string, timer: boolean}[]) : []);
            const participantRows = await conn.query("SELECT id, name, forename, class_name AS class, remarks FROM participants;");
            var participants = (Array.isArray(participantRows) ? (participantRows as {id: number, name: string, forename: string, class: string, remarks: string}[]) : []);

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