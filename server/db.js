require('dotenv').config();
const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === 'production';

const connectionString = process.env.DATABASE_URL || `postgresql://${process.env.USER}:${process.env.USER}@localhost:5432/aircraft_inventory`;

const pool = new Pool({
    connectionString: isProduction ? process.env.DATABASE_URL : connectionString,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};
