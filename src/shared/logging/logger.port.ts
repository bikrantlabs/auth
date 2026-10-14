/**
 * The logging port. Application and adapter layers depend on this interface, never
 * on a concrete logger, so the implementation can be swapped (
 * pino, a test double) without touching business code.
 *
 * Deliberately four methods. Levels beyond these, structured context, and child
 * loggers get added when something needs them — not speculatively.
 */
export interface LoggerPort {
  debug(message: string, context?: string): void;
  info(message: string, context?: string): void;
  warn(message: string, context?: string): void;
  error(message: string, error?: unknown, context?: string): void;
}

/**
 * DI token for LoggerPort. Interfaces are erased at runtime, so the
 * container needs an explicit token. Symbol so it cannot collide
 * with another module's token.
 */
export const LOGGER = Symbol("LoggerPort");

