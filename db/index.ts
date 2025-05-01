import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// This is the correct way neon config with SSL configuration
neonConfig.webSocketConstructor = ws;
// Disable strict certificate checking for WebSocket connections
neonConfig.wsProxy = (url) => {
  const proxyUrl = new URL(url);
  proxyUrl.searchParams.append('ssl', 'true');
  return proxyUrl.toString();
};

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure the pool with SSL settings to handle expired certificates
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // This allows expired or self-signed certificates (only use in development)
  }
});
export const db = drizzle({ client: pool, schema });