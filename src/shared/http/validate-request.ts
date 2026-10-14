import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

/**
 * Shared zod body validator. Keeps presentation thin:
 * parse → 400 on failure, else next() with typed req.body.
 */
export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      }));
      next(
        Object.assign(new Error("Validation failed"), {
          statusCode: 400,
          code: "VALIDATION_ERROR",
          details: issues,
        }),
      );
      return;
    }
    req.body = parsed.data;
    next();
  };
}
