export type SendEmailOptions = {
  to: string;
  subject: string;
  data: {
    token: string;
  };
};
export interface EmailSenderPort {
  sendVerificationEmail(options: SendEmailOptions): Promise<void>;
  sendWelcomeEmail(): Promise<void>;
}
