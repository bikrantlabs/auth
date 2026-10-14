import { Queue } from "bullmq";
import { env } from "@/config/env";
import type { VerificationEmailQueuePort } from "../../../application/ports/outbound/verification-email-queue.port";

export type VerificationEmailJob = {
  userId: string;
  email: string;
};

export const VERIFICATION_EMAIL_QUEUE_NAME = "verification-email" as const;

/**
 * BullMQ VerificationEmailQueue (outbound adapter).
 * Application calls enqueueVerificationEmail(); BullMQ persists the job
 * in Redis; the worker picks it up asynchronously.
 */
export class BullMqVerificationEmailQueue implements VerificationEmailQueuePort {
  private readonly queue: Queue<VerificationEmailJob>;

  constructor(queue?: Queue<VerificationEmailJob>) {
    this.queue =
      queue ??
      new Queue<VerificationEmailJob>(VERIFICATION_EMAIL_QUEUE_NAME, {
        connection: { url: env.REDIS_URL },
      });
  }

  async enqueueVerificationEmail(job: VerificationEmailJob): Promise<void> {
    await this.queue.add("send-verification-email", job, {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    });
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}

