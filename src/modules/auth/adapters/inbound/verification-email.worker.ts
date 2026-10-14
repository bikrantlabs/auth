import { Worker, type Job } from "bullmq";
import { env } from "@/config/env";
import type { LoggerPort } from "@/shared/logging/logger.port";
import type { SendVerificationEmailUseCase } from "../../application/ports/inbound/send-verification-email.usecase";
import {
  VERIFICATION_EMAIL_QUEUE_NAME,
  type VerificationEmailJob,
} from "../outbound/queue/bullmq-verification-email.queue";

/**
 * BullMQ Worker (inbound adapter). Picks up verification-email jobs and
 * calls the SendVerificationEmailUseCase — the mirror image of the HTTP
 * controller, which is also an inbound adapter calling a use case.
 */
export class VerificationEmailWorker {
  private worker: Worker<VerificationEmailJob> | null = null;

  constructor(
    private readonly sendService: SendVerificationEmailUseCase,
    private readonly logger: LoggerPort,
  ) {}

  start(): void {
    if (this.worker) {
      return;
    }
    this.worker = new Worker<VerificationEmailJob>(
      VERIFICATION_EMAIL_QUEUE_NAME,
      async (job: Job<VerificationEmailJob>) => {
        this.logger.info(
          `Processing verification email for ${job.data.email}`,
          "VerificationEmailWorker",
        );
        await this.sendService.execute({
          userId: job.data.userId,
          email: job.data.email,
          occuredAt: new Date(),
        });
      },
      { connection: { url: env.REDIS_URL } },
    );

    this.worker.on("completed", (job: Job<VerificationEmailJob>) => {
      this.logger.info(
        `Verification email sent for ${job.data.email}`,
        "VerificationEmailWorker",
      );
    });

    this.worker.on("failed", (job, err: Error) => {
      this.logger.error(
        `Verification email failed for ${job?.data.email}`,
        err,
        "VerificationEmailWorker",
      );
    });
  }

  async stop(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
    }
  }
}
