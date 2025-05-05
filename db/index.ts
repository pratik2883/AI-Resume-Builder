import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create a MySQL connection pool
export const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // This allows expired or self-signed certificates (only use in development)
  },
  connectionLimit: 10
});

// Create a Drizzle instance using the pool
export const db = drizzle(pool, { schema, mode: 'default' });