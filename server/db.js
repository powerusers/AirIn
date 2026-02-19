import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const isProduction = process.env.NODE_ENV === 'production';

// Use DATABASE_URL if available, otherwise fallback to local defaults
const connectionString = process.env.DATABASE_URL || `postgresql://${process.env.USER}:${process.env.USER}@localhost:5432/aircraft_inventory`;

export const pool = new Pool({
    connectionString,
    // Enable SSL in production, or if explicitly requested via DB_SSL env var
    ssl: (isProduction || process.env.DB_SSL === 'true')
        ? { rejectUnauthorized: false }
        : false,
});

export const query = (text, params) => pool.query(text, params);

export default {
    query,
    pool,
};
