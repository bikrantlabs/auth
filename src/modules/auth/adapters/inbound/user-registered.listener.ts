import type { EventEmitter } from "node:events";
import type { UserRegisteredEvent } from "../../application/ports/outbound/auth-event.port";
import type { ScheduleVerificationEmailUseCase } from "../../application/ports/inbound/schedule-verification-email.usecase";
import type { LoggerPort } from "@/shared/logging/logger.port";

const USER_REGISTERED = "user.registered" as const;

export class UserRegisteredEmailListener {
  constructor(
    private readonly emitter: EventEmitter,
    private readonly scheduleService: ScheduleVerificationEmailUseCase,
    private readonly logger: LoggerPort,
  ) {
    this.emitter.on(USER_REGISTERED, (e: UserRegisteredEvent) => {
      this.scheduleService.execute(e).catch((err: unknown) => {
        this.logger.error(
          "Failed to schedule verification email",
          err,
          "UserRegisteredEmailListener",
        );
      });
    });
  }
}
