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

export class CacheService implements CacheService {
  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const client = getRedis();
    const serialised = JSON.stringify(value);
    if (ttlSeconds) {
      await client.setEx(key, ttlSeconds, serialised);
    } else {
      await client.set(key, serialised);
    }
  }

  /**
   * Retrieve and deserialise a value. Returns null if key doesn't exist.
   */
  async get<T>(key: string): Promise<T | null> {
    const client = getRedis();
    const raw = await client.get(key);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as T;
  }

  async delete(key: string): Promise<void> {
    const client = getRedis();
    await client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const client = getRedis();
    const count = await client.exists(key);
    return count > 0;
  }

  /**
   * Increment a counter. Used for rate limiting.
   * Returns the new value after increment.
   */
  async increment(key: string, ttlSeconds?: number): Promise<number> {
    const client = getRedis();
    const newValue = await client.incr(key);
    // Set TTL only on first increment — subsequent calls shouldn't reset the window
    if (newValue === 1 && ttlSeconds) {
      await client.expire(key, ttlSeconds);
    }
    return newValue;
  }

  /**
   * Atomically set multiple values. Used for token rotation (invalidate old, set new).
   */
  async mset(
    entries: { key: string; value: unknown; ttlSeconds?: number }[],
  ): Promise<void> {
    const client = getRedis();
    const pipeline = client.multi();
    for (const { key, value, ttlSeconds } of entries) {
      const serialised = JSON.stringify(value);
      if (ttlSeconds) {
        pipeline.setEx(key, ttlSeconds, serialised);
      } else {
        pipeline.set(key, serialised);
      }
    }
    await pipeline.exec();
  }
}

export const cacheKeys = {
  // Verify email after register
  emailVerification: (emailHash: string) => `auth:email_verify:${emailHash}`,
  emailVerificationCooldown: (emailHash: string) =>
    `auth:email_verify_cooldown:${emailHash}`,
};
