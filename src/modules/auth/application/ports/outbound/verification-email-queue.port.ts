export interface VerificationEmailQueuePort {
  enqueueVerificationEmail(job: {
    userId: string;
    email: string;
  }): Promise<void>;
}
