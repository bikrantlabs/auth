import { UserRegisteredEvent } from "./ports/outbound/auth-event.port";
import { ScheduleVerificationEmailUseCase } from "./ports/inbound/schedule-verification-email.usecase";
import { VerificationEmailQueuePort } from "./ports/outbound/verification-email-queue.port";

export class ScheduleVerificationEmailService implements ScheduleVerificationEmailUseCase {
  constructor(private readonly queue: VerificationEmailQueuePort) {}

  async execute(event: UserRegisteredEvent): Promise<void> {
    await this.queue.enqueueVerificationEmail({
      userId: event.userId,
      email: event.email,
    });
  }
}
