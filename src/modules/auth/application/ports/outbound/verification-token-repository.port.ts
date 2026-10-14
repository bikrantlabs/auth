import { Email } from "@/modules/auth/domain/value-objects/email.vo";

export interface VerificationTokenRepositoryPort {
  createToken(token: string, email: Email): Promise<void>;

  getToken(email: Email): Promise<string>;
}
