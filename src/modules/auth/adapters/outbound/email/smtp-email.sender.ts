import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/config/env";
import type {
  EmailSenderPort,
  SendEmailOptions,
} from "../../../application/ports/outbound/email-sender.port";
import { verifyEmailTemplate } from "./templates/verify-email.template";

/**
 * Nodemailer EmailSender (dev → Mailpit on EMAIL_HOST:EMAIL_PORT).
 * Renders the verification template and sends the plaintext code —
 * hashing/storage happens upstream in the application service.
 */
export class SmtpEmailSender implements EmailSenderPort {
  private readonly transporter: Transporter;

  constructor(transporter?: Transporter) {
    this.transporter =
      transporter ??
      nodemailer.createTransport({
        host: env.EMAIL_HOST,
        port: env.EMAIL_PORT,
      });
  }

  async sendVerificationEmail(options: SendEmailOptions): Promise<void> {
    const expiresInMinutes = Math.round(env.VERIFICATION_CODE_EXPIRY_SECONDS / 60);
    await this.transporter.sendMail({
      from: env.EMAIL_FROM,
      to: options.to,
      subject: options.subject || verifyEmailTemplate.subject,
      text: verifyEmailTemplate.text({
        token: options.data.token,
        expiresInMinutes,
      }),
      html: verifyEmailTemplate.html({
        token: options.data.token,
        expiresInMinutes,
      }),
    });
  }

  async sendWelcomeEmail(): Promise<void> {
    throw new Error("sendWelcomeEmail not implemented.");
  }
}
