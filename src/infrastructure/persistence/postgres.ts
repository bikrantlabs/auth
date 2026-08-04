import { Pool } from "pg";
import { env } from "@/config/env";
import { logger } from "@/shared/logger";

export const db = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

db.on("error", (err) => {
  logger.error({ err }, "Unexpected database pool error");
});

export async function connectDB(): Promise<void> {
  const client = await db.connect();
  try {
    await client.query("SELECT 1");
    logger.info("Database connected");
  } finally {
    client.release();
  }
}

export async function disconnectDB(): Promise<void> {
  await db.end();
  logger.info("Database disconnected");
}
