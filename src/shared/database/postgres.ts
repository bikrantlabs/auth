import { Pool } from "pg";
import { env } from "@/config/env";
import { logger } from "@/shared/logging/pino.logger";

/**
 * Shared Postgres pool. Owned by shared/ (cross-cutting),
 * injected into module adapters via the PG_POOL token.
 */
export const pool = new Pool({ connectionString: env.DATABASE_URL });

export const PG_POOL = Symbol("PgPool");

pool.on("error", (err) => {
  logger.error("Unexpected pg pool error", err, "Postgres");
});

export async function connectDB(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
    logger.info("Postgres connected", "Postgres");
  } finally {
    client.release();
  }
}

export async function disconnectDB(): Promise<void> {
  await pool.end();
  logger.info("Postgres pool closed", "Postgres");
}
