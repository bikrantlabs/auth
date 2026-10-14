import type { LoggerPort } from "@/shared/logging/logger.port";
import { startWorker, type WorkerHandle } from "@/shared/queue/worker";
import type { SendVerificationEmailUseCase } from "../../application/ports/inbound/send-verification-email.usecase";
import {
  VERIFICATION_EMAIL_QUEUE_NAME,
  type VerificationEmailJob,
} from "../../application/verification-email.job";

/**
 * Auth's side of the inbound worker adapter: it only says WHAT to do with a
 * verification-email job (call the send use case). The generic BullMQ worker
 * loop — start, logging, shutdown — lives in shared/queue/worker.
 *
 * The mirror image of the HTTP controller: both are inbound adapters
 * driving the application.
 */
export function createVerificationEmailWorker(
  sendService: SendVerificationEmailUseCase,
  logger: LoggerPort,
): WorkerHandle {
  return startWorker<VerificationEmailJob>(
    VERIFICATION_EMAIL_QUEUE_NAME,
    async (job) => {
      logger.info(
        `Processing verification email for ${job.email}`,
        "VerificationEmailWorker",
      );
      await sendService.execute({
        userId: job.userId,
        email: job.email,
        occuredAt: new Date(),
      });
    },
    logger,
    "VerificationEmailWorker",
  );
}

