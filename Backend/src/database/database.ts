import { PoolOptions, createPool } from 'mysql2';
import 'dotenv/config'

const access: PoolOptions = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS
};

export const connection = createPool(access);
