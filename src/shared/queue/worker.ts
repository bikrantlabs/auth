import { Worker, type Job } from "bullmq";
import { env } from "@/config/env";
import type { LoggerPort } from "@/shared/logging/logger.port";
import type { JobHandler } from "./queue.port";

export type WorkerHandle = {
  stop: () => Promise<void>;
};

/**
 * Generic worker starter (shared). Given a queue name + handler function,
 * runs the BullMQ worker loop. Modules pass their own handler — the loop
 * itself is written once, here.
 */
export function startWorker<TPayload>(
  queueName: string,
  handler: JobHandler<TPayload>,
  logger: LoggerPort,
  context = "Worker",
): WorkerHandle {
  const worker = new Worker<TPayload>(
    queueName,
    async (job: Job<TPayload>) => {
      await handler(job.data);
    },
    { connection: { url: env.REDIS_URL } },
  );

  worker.on("completed", (job: Job<TPayload>) => {
    logger.info(`Job completed on ${queueName} (${job.id})`, context);
  });

  worker.on("failed", (job, err: Error) => {
    logger.error(`Job failed on ${queueName} (${job?.id})`, err, context);
  });

  return {
    stop: async (): Promise<void> => {
      await worker.close();
    },
  };
}
