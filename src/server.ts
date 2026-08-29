import { createApp } from "@/app";
import { env } from "@/config/env";
import { connectDB, disconnectDB } from "@/infrastructure/persistence/postgres";
import { connectRedis, disconnectRedis } from "@/infrastructure/redis/redis";
import { logger } from "@/shared/logger";

async function start() {
  try {
    // await connectDB();
    // await connectRedis();

    const app = createApp();

    const server = app.listen(env.PORT, () => {
      logger.info(
        { port: env.PORT, url: `http://localhost:${env.PORT}` },
        "Server started",
      );
    });

    async function shutdown(signal: string) {
      logger.info({ signal }, "Shutdown signal received");

      server.close(async () => {
        logger.info("HTTP server closed");
        try {
          await disconnectDB();
          await disconnectRedis();
          logger.info("Graceful shutdown complete");
          process.exit(0);
        } catch (err) {
          logger.error({ err }, "Error during shutdown");
          process.exit(1);
        }
      });

      // Force exit after 30s if graceful shutdown hangs
      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
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
      logger.fatal({ reason }, "Unhandled promise rejection");
      process.exit(1);
    });

    process.on("uncaughtException", (err) => {
      logger.fatal({ err }, "Uncaught exception");
      process.exit(1);
    });
  } catch (error) {
    logger.fatal({ error }, "Failed to start server");
    process.exit(1);
  }
}
start();
