import { PoolOptions, createPool } from 'mysql2';
import { readFileSync } from 'fs';
import 'dotenv/config'

const access: PoolOptions = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    // password: process.env.DB_PASS,
    password: readFileSync(process.env.DB_PASS_FILE, 'utf8').trim(),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

export const connection = createPool(access);

export const checkDBConnection = async () => {
    try {
        const promisePool = connection.promise();
        await promisePool.query('SELECT 1');
        console.log('Database connection established successfully.');
    } catch (error) {
        console.error('Error connecting to the database:', error.message);
        throw new Error('Database connection failed');
    }
};
