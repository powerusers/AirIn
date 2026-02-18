import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev-only';

app.use(helmet());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Middleware for auth
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access token required' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token' });
        req.user = user;
        next();
    });
};

const authorize = (roles = []) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Unauthorized access' });
        }
        next();
    };
};

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// API Endpoints

// Login
app.post('/api/auth/login', [
    body('username').trim().notEmpty(),
    body('password').notEmpty()
], validateRequest, async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await db.query(
            'SELECT * FROM users WHERE username = $1',
            [username]
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];
            const validPassword = await bcrypt.compare(password, user.password);

            if (validPassword) {
                const token = jwt.sign(
                    { id: user.id, username: user.username, role: user.role },
                    JWT_SECRET,
                    { expiresIn: '8h' }
                );
                res.json({
                    token,
                    user: { id: user.id, username: user.username, name: user.name, role: user.role }
                });
            } else {
                res.status(401).json({ error: 'Invalid credentials' });
            }
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all parts
app.get('/api/parts', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM parts ORDER BY id ASC');
        res.json(result.rows.map(row => ({
            ...row,
            partNumber: row.part_number,
            serialNumber: row.serial_number,
            batchNumber: row.batch_number,
            reorderPoint: row.reorder_point,
            certOfConformance: row.cert_of_conformance,
            shelfLife: row.shelf_life,
            unitCost: parseFloat(row.unit_cost)
        })));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add new part
app.post('/api/parts', authenticateToken, authorize(['Admin', 'Stock Controller']), [
    body('partNumber').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('category').trim().notEmpty(),
    body('manufacturer').trim().notEmpty(),
    body('quantity').isInt({ min: 0 }),
    body('location').trim().notEmpty(),
    body('condition').trim().notEmpty(),
    body('unitCost').isFloat({ min: 0 })
], validateRequest, async (req, res) => {
    const { partNumber, description, category, manufacturer, serialNumber, batchNumber, quantity, reorderPoint, location, condition, certOfConformance, shelfLife, unitCost } = req.body;
    try {
        const result = await db.query(
            `INSERT INTO parts (part_number, description, category, manufacturer, serial_number, batch_number, quantity, reorder_point, location, condition, cert_of_conformance, shelf_life, unit_cost)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
            [partNumber, description, category, manufacturer, serialNumber, batchNumber, quantity, reorderPoint, location, condition, certOfConformance, shelfLife || null, unitCost]
        );
        const row = result.rows[0];
        res.json({
            ...row,
            partNumber: row.part_number,
            serialNumber: row.serial_number,
            batchNumber: row.batch_number,
            reorderPoint: row.reorder_point,
            certOfConformance: row.cert_of_conformance,
            shelfLife: row.shelf_life,
            unitCost: parseFloat(row.unit_cost)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update part
app.put('/api/parts/:id', authenticateToken, authorize(['Admin', 'Stock Controller']), [
    body('partNumber').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('category').trim().notEmpty(),
    body('manufacturer').trim().notEmpty(),
    body('quantity').isInt({ min: 0 }),
    body('location').trim().notEmpty(),
    body('condition').trim().notEmpty(),
    body('unitCost').isFloat({ min: 0 })
], validateRequest, async (req, res) => {
    const { id } = req.params;
    const { partNumber, description, category, manufacturer, serialNumber, batchNumber, quantity, reorderPoint, location, condition, certOfConformance, shelfLife, unitCost } = req.body;

    try {
        const result = await db.query(
            `UPDATE parts SET 
       part_number = $1, description = $2, category = $3, manufacturer = $4, serial_number = $5, batch_number = $6, quantity = $7, reorder_point = $8, location = $9, condition = $10, cert_of_conformance = $11, shelf_life = $12, unit_cost = $13
       WHERE id = $14
       RETURNING *`,
            [partNumber, description, category, manufacturer, serialNumber, batchNumber, quantity, reorderPoint, location, condition, certOfConformance, shelfLife || null, unitCost, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Part not found' });
        }

        const row = result.rows[0];
        res.json({
            ...row,
            partNumber: row.part_number,
            serialNumber: row.serial_number,
            batchNumber: row.batch_number,
            reorderPoint: row.reorder_point,
            certOfConformance: row.cert_of_conformance,
            shelfLife: row.shelf_life,
            unitCost: parseFloat(row.unit_cost)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get transactions
app.get('/api/transactions', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(`
      SELECT t.*, u.name as user_name 
      FROM transactions t 
      LEFT JOIN users u ON t.user_id = u.id 
      ORDER BY t.date DESC
    `);
        res.json(result.rows.map(row => ({
            ...row,
            partId: row.part_id,
            userId: row.user_id,
            userName: row.user_name
        })));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add transaction (and update part quantity)
app.post('/api/transactions', authenticateToken, authorize(['Admin', 'Stock Controller']), [
    body('partId').isInt(),
    body('type').isIn(['IN', 'OUT']),
    body('quantity').isInt({ min: 1 }),
    body('userId').isInt()
], validateRequest, async (req, res) => {
    const { partId, type, quantity, reference, note, userId } = req.body;

    const client = await db.pool ? await db.pool.connect() : { query: db.query, release: () => { } };

    try {
        await client.query('BEGIN');

        // 1. Record transaction
        const txResult = await client.query(
            `INSERT INTO transactions (part_id, type, quantity, reference, note, user_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [partId, type, quantity, reference, note, userId]
        );

        // 2. Update part quantity
        const operator = type === 'IN' ? '+' : '-';
        await client.query(
            `UPDATE parts SET quantity = quantity ${operator} $1 WHERE id = $2`,
            [quantity, partId]
        );

        await client.query('COMMIT');

        // Fetch user name for response
        const userRes = await client.query('SELECT name FROM users WHERE id = $1', [userId]);
        const userName = userRes.rows[0]?.name;

        const row = txResult.rows[0];
        res.json({
            ...row,
            partId: row.part_id,
            userId: row.user_id,
            userName
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        if (client.release) client.release();
    }
});

// Get audit logs
app.get('/api/audit', authenticateToken, authorize(['Admin']), async (req, res) => {
    try {
        const result = await db.query(`
      SELECT a.*, u.name as user_name, u.role as user_role 
      FROM audit_logs a 
      JOIN users u ON a.user_id = u.id 
      ORDER BY a.date DESC
    `);
        res.json(result.rows.map(row => ({
            date: row.date,
            action: row.action,
            userName: row.user_name,
            userRole: row.user_role
        })));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add audit log (Protected but internal usually)
app.post('/api/audit', authenticateToken, async (req, res) => {
    const { action, userId } = req.body;
    try {
        await db.query('INSERT INTO audit_logs (action, user_id) VALUES ($1, $2)', [action, userId]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Serve React App in Production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../dist')));

    app.get(/(.*)/, (req, res) => {
        res.sendFile(path.join(__dirname, '../dist/index.html'));
    });
}

import { ensureDb } from './ensureDb.js';

// Start server after DB check
ensureDb().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to start server:', err);
});
