import type { UserRegisteredEvent } from "../outbound/auth-event.port";

export interface ScheduleVerificationEmailUseCase {
  execute(event: UserRegisteredEvent): Promise<void>;
}
