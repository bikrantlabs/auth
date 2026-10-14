import { createClient, type RedisClientType } from "redis";
import { env } from "@/config/env";
import { logger } from "@/shared/logging/pino.logger";

/**
 * Shared Redis client. Owned by shared/, injected via REDIS_CLIENT token.
 */
export const REDIS_CLIENT = Symbol("RedisClient");

let client: RedisClientType | null = null;

export async function connectRedis(): Promise<RedisClientType> {
  if (client?.isOpen) {
    return client;
  }
  client = createClient({ url: env.REDIS_URL });
  client.on("error", (err) => logger.error("Redis error", err, "Redis"));
  await client.connect();
  logger.info("Redis connected", "Redis");
  return client;
}

export async function disconnectRedis(): Promise<void> {
  if (client?.isOpen) {
    await client.quit();
    logger.info("Redis disconnected", "Redis");
  }
  client = null;
}

export function getRedis(): RedisClientType {
  if (!client || !client.isOpen) {
    throw new Error("Redis not connected. Call connectRedis() at startup.");
  }
  return client;
}
