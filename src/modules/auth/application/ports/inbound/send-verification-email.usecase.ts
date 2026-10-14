import { UserRegisteredEvent } from "../outbound/auth-event.port";

export interface SendVerificationEmailUseCase {
  execute(event: UserRegisteredEvent): Promise<void>;
}
