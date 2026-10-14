import { UserRegisteredEvent } from "./ports/outbound/auth-event.port";
import { SendVerificationEmailUseCase } from "./ports/inbound/send-verification-email.usecase";
import { EmailSenderPort } from "./ports/outbound/email-sender.port";
import { VerificationTokenRepositoryPort } from "./ports/outbound/verification-token-repository.port";
import { VerificationToken } from "../domain/value-objects/verification-token.vo";
import { TokenHasher } from "./ports/outbound/token-hasher.port";
import { Email } from "../domain/value-objects/email.vo";

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

    await this.mailer.sendVerificationEmail({
      to: email.value,
      subject: "Verify your email",
      data: { token: token.value },
    });
  }
}

