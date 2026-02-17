import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const isProduction = process.env.NODE_ENV === 'production';

const connectionString = process.env.DATABASE_URL || `postgresql://${process.env.USER}:${process.env.USER}@localhost:5432/aircraft_inventory`;

export const pool = new Pool({
    connectionString: isProduction ? process.env.DATABASE_URL : connectionString,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
});

export const query = (text, params) => pool.query(text, params);

export default {
    query,
    pool,
};
