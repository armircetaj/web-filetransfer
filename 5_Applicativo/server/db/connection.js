const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();
// Configurazione connessione PostgreSQL
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'webfiletransfer',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 20, // max connessioni nel pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};
const pool = new Pool(dbConfig);

async function testConnection() {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        console.log('Database connected successfully:', result.rows[0]);
        client.release();
        return true;
    } catch (error) {
        console.error('Database connection failed:', error.message);
        return false;
    }
}
// Esegue query con logging delle performance
async function query(text, params = []) {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text, duration, rows: result.rowCount });
        return result;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}
async function getClient() {
    try {
        return await pool.connect();
    } catch (error) {
        console.error('Failed to get database client:', error);
        throw error;
    }
}
async function closePool() {
    try {
        await pool.end();
        console.log('Database pool closed');
    } catch (error) {
        console.error('Error closing database pool:', error);
        throw error;
    }
}
process.on('SIGINT', async () => {
    console.log('Received SIGINT, closing database pool...');
    await closePool();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, closing database pool...');
    await closePool();
    process.exit(0);
});
module.exports = {
    pool,
    query,
    getClient,
    testConnection,
    closePool
};
