import { env } from "@/config/env";
import type { EmailSenderPort } from "@/shared/email/email-sender.port";
import { UserRegisteredEvent } from "./ports/outbound/auth-event.port";
import { SendVerificationEmailUseCase } from "./ports/inbound/send-verification-email.usecase";
import { VerificationTokenRepositoryPort } from "./ports/outbound/verification-token-repository.port";
import { VerificationToken } from "../domain/value-objects/verification-token.vo";
import { TokenHasher } from "./ports/outbound/token-hasher.port";
import { Email } from "../domain/value-objects/email.vo";
import { verifyEmailTemplate } from "./verify-email.template";

export class SendVerificationEmailService implements SendVerificationEmailUseCase {
  constructor(
    private readonly mailer: EmailSenderPort,
    private readonly tokenHasher: TokenHasher,
    private readonly verificationTokenRepository: VerificationTokenRepositoryPort,
  ) {}

  async execute(event: UserRegisteredEvent): Promise<void> {
    const token = VerificationToken.create();

    // Only the hash is persisted — the plaintext travels by email only.
    const hashed = this.tokenHasher.hash(token);

    const email = new Email(event.email);

    await this.verificationTokenRepository.createToken(hashed, email);

    const expiresInMinutes = Math.round(env.VERIFICATION_CODE_EXPIRY_SECONDS / 60);

    await this.mailer.send({
      to: email.value,
      subject: verifyEmailTemplate.subject,
      text: verifyEmailTemplate.text({
        token: token.value,
        expiresInMinutes,
      }),
      html: verifyEmailTemplate.html({
        token: token.value,
        expiresInMinutes,
      }),
    });
  }
}


