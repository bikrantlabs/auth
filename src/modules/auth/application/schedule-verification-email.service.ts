import type { JobQueuePort } from "@/shared/queue/queue.port";
import { UserRegisteredEvent } from "./ports/outbound/auth-event.port";
import { ScheduleVerificationEmailUseCase } from "./ports/inbound/schedule-verification-email.usecase";
import type { VerificationEmailJob } from "./verification-email.job";

export class ScheduleVerificationEmailService implements ScheduleVerificationEmailUseCase {
  constructor(private readonly queue: JobQueuePort<VerificationEmailJob>) {}

  async execute(event: UserRegisteredEvent): Promise<void> {
    await this.queue.enqueue({
      userId: event.userId,
      email: event.email,
    });
  }
}

