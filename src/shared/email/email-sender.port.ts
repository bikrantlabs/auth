/**
 * Generic email sender port (shared). Knows SMTP-shaped messages —
 * nothing about verification codes, templates, or any domain.
 */
export interface EmailSenderPort {
  send(options: SendEmailOptions): Promise<void>;
}

export type SendEmailOptions = {
  to: string;
  subject: string;
  text: string;
  html: string;
};
