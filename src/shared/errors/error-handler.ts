import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError, ValidationError, InternalServerError } from "./app-errors";
import { createLogger } from "@/shared/logger";

const logger = createLogger("error-handler");

/**
 * Converts a ZodError into a ValidationError with field-level detail.
 * Zod runs at the validator layer, but we catch it here as a safety net too.
 */
function handleZodError(err: ZodError): ValidationError {
  const fields: Record<string, string[]> = {};
  for (const issue of err.issues) {
    const path = issue.path.join(".");
    if (!fields[path]) {
      fields[path] = [];
    }
    fields[path].push(issue.message);
  }
  return new ValidationError("Validation failed", fields);
}

/**
 * Formats the error response sent to the client.
 * Non-operational errors get a generic message — never leak stack traces.
 */
function formatErrorResponse(err: AppError, includeStack: boolean) {
  const body: Record<string, unknown> = {
    success: false,
    error: {
      code: err.code,
      message: err.isOperational ? err.message : "Something went wrong",
    },
  };

  // Include field errors for validation failures
  if (err instanceof ValidationError && err.fields) {
    (body.error as Record<string, unknown>).fields = err.fields;
  }

  // Only include stack in development
  if (includeStack && err.stack) {
    (body.error as Record<string, unknown>).stack = err.stack;
  }

  return body;
}

/**
 * Express error-handling middleware. Must be registered LAST with app.use().
 * The 4-parameter signature is required for Express to recognise it as error middleware.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const isDev = process.env.NODE_ENV !== "production";

  // Normalise to AppError
  let appError: AppError;

  if (err instanceof AppError) {
    appError = err;
  } else if (err instanceof ZodError) {
    appError = handleZodError(err);
  } else {
    // Unknown error — wrap it but mark as non-operational
    appError = new InternalServerError(err.message);
  }

  // Log operational errors at warn, unexpected at error
  if (!appError.isOperational) {
    logger.error(
      { err: appError, req: { method: req.method, url: req.url } },
      "Unexpected error",
    );
  } else if (appError.statusCode >= 500) {
    logger.warn(
      { err: appError, req: { method: req.method, url: req.url } },
      "Operational server error",
    );
  }

  res.status(appError.statusCode).json(formatErrorResponse(appError, isDev));
}

/**
 * Wraps async route handlers so you don't need try/catch in every controller.
 * Usage: router.post("/register", asyncHandler(authController.register))
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
