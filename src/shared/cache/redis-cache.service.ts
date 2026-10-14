import { getRedis } from "./redis";
import type { CacheService } from "./cache.port";

/**
 * Redis-backed CacheService. Thin JSON wrapper over the shared client from
 * ./redis — keeps serialisation/TTL conventions in one place.
 */
export class RedisCacheService implements CacheService {
  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const client = getRedis();
    const serialised = JSON.stringify(value);
    if (ttlSeconds) {
      await client.setEx(key, ttlSeconds, serialised);
    } else {
      await client.set(key, serialised);
    }
  }

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

  async increment(key: string, ttlSeconds?: number): Promise<number> {
    const client = getRedis();
    const newValue = await client.incr(key);
    // Set TTL only on first increment — subsequent calls shouldn't reset the window
    if (newValue === 1 && ttlSeconds) {
      await client.expire(key, ttlSeconds);
    }
    return newValue;
  }

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
