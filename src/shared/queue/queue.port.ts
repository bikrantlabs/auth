/**
 * Generic job queue port (shared). Knows nothing about email, auth, or any
 * domain — TPayload is supplied by the module that uses it.
 */
export interface JobQueuePort<TPayload> {
  enqueue(job: TPayload): Promise<void>;
  close(): Promise<void>;
}

/** A function that processes one job payload. Modules pass their own. */
export type JobHandler<TPayload> = (job: TPayload) => Promise<void>;
