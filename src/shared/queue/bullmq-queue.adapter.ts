import { Queue } from "bullmq";
import { env } from "@/config/env";
import type { JobQueuePort } from "./queue.port";

/**
 * BullMQ queue with the name type pinned to `string` so plain payload types
 * work with `add()` (BullMQ's NameType is otherwise a deferred conditional).
 */
export type GenericQueue<TPayload> = Queue<TPayload, unknown, string, TPayload, unknown, string>;

/**
 * Generic BullMQ queue (shared). One class serves every module — the module
 * supplies TPayload and the queue name via the container, e.g.
 * `new BullMqQueue(createQueue<VerificationEmailJob>("verification-email"))`.
 */
export class BullMqQueue<TPayload> implements JobQueuePort<TPayload> {
  constructor(private readonly queue: GenericQueue<TPayload>) {}

  async enqueue(job: TPayload): Promise<void> {
    await this.queue.add("job", job, {
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

export function createQueue<TPayload>(name: string): GenericQueue<TPayload> {
  return new Queue<TPayload, unknown, string, TPayload, unknown, string>(name, {
    connection: { url: env.REDIS_URL },
  });
}
