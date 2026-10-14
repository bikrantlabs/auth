import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/config/env";
import type {
  EmailSenderPort,
  SendEmailOptions,
} from "./email-sender.port";

/**
 * Nodemailer EmailSender (shared, dev → Mailpit on EMAIL_HOST:EMAIL_PORT).
 * Sends pre-rendered messages — templates live in the calling module.
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

  async send(options: SendEmailOptions): Promise<void> {
    await this.transporter.sendMail({
      from: env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
  }
}
