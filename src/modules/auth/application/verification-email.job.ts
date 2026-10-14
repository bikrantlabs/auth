/**
 * The verification-email job contract — auth's intent, not the mechanism.
 * The generic queue/worker code lives in shared/queue and is parameterized
 * with this payload type and queue name at the composition root.
 */
export type VerificationEmailJob = {
  userId: string;
  email: string;
};

export const VERIFICATION_EMAIL_QUEUE_NAME = "verification-email" as const;
