/**
 * Database Connection with Drizzle ORM
 * Supports both PostgreSQL and in-memory fallback
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

let db: ReturnType<typeof drizzle> | null = null;
let pool: Pool | null = null;

/**
 * Get or create database connection
 */
export function getDb() {
  if (db) return db;

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.warn("[DB] DATABASE_URL not set, using in-memory storage");
    return null;
  }

  try {
    pool = new Pool({
      connectionString: databaseUrl,
      max: 20, // Maximum pool size
      idleTimeoutMillis: 30000, // Close idle clients after 30s
      connectionTimeoutMillis: 10000, // Return error after 10s if no connection
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
    });

    // Handle pool errors
    pool.on("error", (err) => {
      console.error("[DB] Unexpected pool error:", err);
    });

    db = drizzle(pool, { schema });
    console.log("[DB] Connected to PostgreSQL");
    return db;
  } catch (error) {
    console.error("[DB] Failed to connect:", error);
    return null;
  }
}

/**
 * Close database connection
 */
export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
    console.log("[DB] Connection closed");
  }
}

/**
 * Health check for database
 */
export async function checkDbHealth(): Promise<boolean> {
  if (!pool) return false;

  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    return true;
  } catch {
    return false;
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  await closeDb();
  process.exit(0);
});

process.on("SIGINT", async () => {
  await closeDb();
  process.exit(0);
});

export { schema };

