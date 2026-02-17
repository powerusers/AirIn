const db = require('./db');
const fs = require('fs');
const path = require('path');

async function setup() {
    try {
        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        console.log('Running schema...');
        await db.query(schema);
        console.log('Database setup complete.');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding database:', err);
        process.exit(1);
    }
}

setup();
