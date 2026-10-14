import "reflect-metadata";
import { createApp } from "@/app";
import { env } from "@/config/env";
import { connectDB, disconnectDB } from "@/shared/database/postgres";
import { connectRedis, disconnectRedis } from "@/shared/cache/redis";
import { logger } from "@/shared/logging/pino.logger";
import { registerDependencies } from "@/shared/di/container";

async function start() {
  try {
    registerDependencies();
    await connectDB();
    await connectRedis();

    const app = createApp();

    const server = app.listen(env.PORT, () => {
      logger.info(`Server started on http://localhost:${env.PORT}`, "Bootstrap");
    });

    async function shutdown(signal: string) {
      logger.info(`Shutdown signal received: ${signal}`, "Bootstrap");

      server.close(async () => {
        logger.info("HTTP server closed", "Bootstrap");
        try {
          await disconnectDB();
          await disconnectRedis();
          logger.info("Graceful shutdown complete", "Bootstrap");
          process.exit(0);
        } catch (err) {
          logger.error("Error during shutdown", err, "Bootstrap");
          process.exit(1);
        }
      });

      // Force exit after 30s if graceful shutdown hangs
      setTimeout(() => {
        logger.error("Forced shutdown after timeout", undefined, "Bootstrap");
        process.exit(1);
      }, 30_000);
    }

    process.on("SIGTERM", () => {
      shutdown("SIGTERM");
    });
    process.on("SIGINT", () => {
      shutdown("SIGINT");
    });

    // Catch unhandled rejections — log and exit (let your process manager restart)
    process.on("unhandledRejection", (reason) => {
      logger.error("Unhandled promise rejection", reason, "Bootstrap");
      process.exit(1);
    });

    process.on("uncaughtException", (err) => {
      logger.error("Uncaught exception", err, "Bootstrap");
      process.exit(1);
    });
  } catch (error) {
    logger.error("Failed to start server", error, "Bootstrap");
    process.exit(1);
  }
}
start();
