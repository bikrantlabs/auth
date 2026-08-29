import { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError } from "zod";

export const validateRequest = (schema: ZodObject) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    // safeParse checks the runtime data without raising unhandled exceptions
    const result = await schema.safeParseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      // Format structural validation errors out of the result object
      res.status(400).json({
        status: "BAD_REQUEST",
        errors: formatZodErrors(result.error),
      });
      return;
    }

    // Assign the cleaned, type-safe data back to the request object
    req.body = result.data.body;
    // req.query = result.data.query;
    // req.params = result.data.params;

    next();
  };
};

// Flatten the ZodError array into readable field-error mappings
const formatZodErrors = (error: ZodError) => {
  return error.issues.map((err) => ({
    field: err.path.join("."),
    message: err.message,
    code: err.code,
  }));
};
