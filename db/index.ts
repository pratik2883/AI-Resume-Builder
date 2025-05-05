import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Check if we have the required database environment variables
const dbHost = process.env.PGHOST || 'localhost';
const dbPort = parseInt(process.env.PGPORT || '5432', 10);
const dbUser = process.env.PGUSER || 'postgres';
const dbPassword = process.env.PGPASSWORD || '';
const dbName = process.env.PGDATABASE || 'postgres';

console.log(`Connecting to PostgreSQL database ${dbName} on ${dbHost}:${dbPort} as ${dbUser}`);

// Create a PostgreSQL connection pool
export const pool = new pg.Pool({
  host: dbHost,
  port: dbPort,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  ssl: {
    rejectUnauthorized: false // This allows expired or self-signed certificates (only use in development)
  },
  max: 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000 // How long a client is allowed to remain idle before being closed
});

// Create a Drizzle instance using the pool
export const db = drizzle(pool, { schema, mode: 'default' });