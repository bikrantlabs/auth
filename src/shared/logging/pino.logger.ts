import pino, { type Logger as PinoLoggerInstance } from "pino";
import { injectable } from "tsyringe";
import { env } from "@/config/env";
import type { LoggerPort } from "@/shared/logging/logger.port";

/**
 * Shared pino adapter for LoggerPort.
 * Cross-cutting: every module injects LOGGER, only this file knows it's pino.
 */
@injectable()
export class PinoLogger implements LoggerPort {
  private readonly inner: PinoLoggerInstance;

  constructor() {
    this.inner = pino({
      level: env.NODE_ENV === "production" ? "info" : "debug",
      transport:
        env.NODE_ENV === "development"
          ? { target: "pino-pretty", options: { colorize: true } }
          : undefined,
    });
  }

  debug(message: string, context?: string): void {
    if (context) {
      this.inner.debug({ context }, message);
    } else {
      this.inner.debug(message);
    }
  }

  info(message: string, context?: string): void {
    if (context) {
      this.inner.info({ context }, message);
    } else {
      this.inner.info(message);
    }
  }

  warn(message: string, context?: string): void {
    if (context) {
      this.inner.warn({ context }, message);
    } else {
      this.inner.warn(message);
    }
  }

  error(message: string, error?: unknown, context?: string): void {
    if (error instanceof Error) {
      this.inner.error({ err: error, context }, message);
    } else if (error !== undefined) {
      this.inner.error({ error, context }, message);
    } else if (context) {
      this.inner.error({ context }, message);
    } else {
      this.inner.error(message);
    }
  }

  /** Escape hatch for framework code (request logging, fatal errors). */
  get raw(): PinoLoggerInstance {
    return this.inner;
  }
}

/** Singleton for app.ts / server.ts without going through the container. */
export const logger = new PinoLogger();
