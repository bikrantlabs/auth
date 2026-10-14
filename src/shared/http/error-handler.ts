import type { NextFunction, Request, Response } from "express";
import { logger } from "@/shared/logging/pino.logger";
import { DomainError } from "@/modules/auth/domain/exceptions/domain-error";

type HttpError = Error & {
  statusCode?: number;
  code?: string;
  details?: unknown;
};

const DOMAIN_STATUS: Record<string, number> = {
  InvalidEmailError: 400,
  WeakPasswordError: 400,
  LongPasswordError: 400,
  EmptyPasswordHashError: 500,
  UserAlreadyExistsError: 409,
};

/**
 * Shared error → HTTP mapper. Domain errors carry their own status
 * via class name; infra errors with statusCode/code pass through;
 * everything else is a 500 (message hidden in production).
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const httpErr = err as HttpError;

  let status = httpErr.statusCode ?? 500;
  let code = httpErr.code ?? "INTERNAL_ERROR";

  if (err instanceof DomainError) {
    status = DOMAIN_STATUS[err.constructor.name] ?? 400;
    code =
      status === 409
        ? "USER_ALREADY_EXISTS"
        : status === 500
          ? "INTERNAL_ERROR"
          : "DOMAIN_ERROR";
  }

  if (status >= 500) {
    logger.error("Unhandled error", err, "ErrorHandler");
  } else {
    logger.warn(`Request failed: ${err.message}`, "ErrorHandler");
  }

  res.status(status).json({
    success: false,
    error: {
      code,
      message: status >= 500 ? "Something went wrong" : err.message,
      ...(httpErr.details !== undefined ? { details: httpErr.details } : {}),
    },
  });
}
