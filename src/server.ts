import "reflect-metadata";
import { createApp } from "@/app";
import { env } from "@/config/env";
import { connectDB, disconnectDB } from "@/shared/database/postgres";
import { connectRedis, disconnectRedis } from "@/shared/cache/redis";
import { logger } from "@/shared/logging/pino.logger";
import { container, registerDependencies } from "@/shared/di/container";
import type { WorkerHandle } from "@/shared/queue/worker";
import type { JobQueuePort } from "@/shared/queue/queue.port";
import { UserRegisteredEmailListener } from "@/modules/auth/adapters/inbound/user-registered.listener";
import {
  VERIFICATION_EMAIL_QUEUE,
  VERIFICATION_EMAIL_WORKER,
} from "@/modules/auth/application/ports/tokens";
import type { VerificationEmailJob } from "@/modules/auth/application/verification-email.job";

async function start() {
  try {
    registerDependencies();
    await connectDB();
    await connectRedis();

    // Inbound adapters: subscribing the listener wires schedule→queue;
    // resolving the worker handle starts queue→send→mailer.
    container.resolve(UserRegisteredEmailListener);
    const emailWorker = container.resolve<WorkerHandle>(VERIFICATION_EMAIL_WORKER);

    const app = createApp();

    const server = app.listen(env.PORT, () => {
      logger.info(`Server started on http://localhost:${env.PORT}`, "Bootstrap");
    });

    async function shutdown(signal: string) {
      logger.info(`Shutdown signal received: ${signal}`, "Bootstrap");

      server.close(async () => {
        logger.info("HTTP server closed", "Bootstrap");
        try {
          await emailWorker.stop();
          const queue = container.resolve<JobQueuePort<VerificationEmailJob>>(
            VERIFICATION_EMAIL_QUEUE,
          );
          await queue.close();
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
