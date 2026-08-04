import { createClient } from "redis";
import { env } from "@/config/env";
import { logger } from "@/shared/logger";

export const redis = createClient({ url: env.REDIS_URL });

redis.on("error", (err) => {
  logger.error({ err }, "Redis client error");
});

export async function connectRedis(): Promise<void> {
  await redis.connect();
  logger.info("Redis connected");
}

export async function disconnectRedis(): Promise<void> {
  await redis.quit();
  logger.info("Redis disconnected");
}
