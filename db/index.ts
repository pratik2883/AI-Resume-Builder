import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "@shared/schema";

// Check if we have the required database environment variables
const dbHost = process.env.PGHOST || 'localhost';
const dbPort = parseInt(process.env.PGPORT || '3306', 10);
const dbUser = process.env.PGUSER || 'root';
const dbPassword = process.env.PGPASSWORD || '';
const dbName = process.env.PGDATABASE || 'resume_builder';

console.log(`Connecting to MySQL database ${dbName} on ${dbHost}:${dbPort} as ${dbUser}`);

// Create a MySQL connection pool using direct parameters
export const pool = mysql.createPool({
  host: dbHost,
  port: dbPort,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  // SSL configuration is optional and might not be needed for local development
  ssl: false,
  connectionLimit: 10,
  connectTimeout: 20000, // Increase timeout to 20 seconds
  waitForConnections: true,
  queueLimit: 0
});

// Create a Drizzle instance using the pool
export const db = drizzle(pool, { schema, mode: 'default' });