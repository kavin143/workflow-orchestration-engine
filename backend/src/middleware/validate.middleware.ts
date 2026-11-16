import type { RequestHandler } from "express";
import type { z } from "zod";
import { AppError } from "../errors/app-error.js";

/**
 * Validates the request body against a Zod schema.
 * Replaces the body with the parsed and validated data.
 */
export function validateBody(schema: z.ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => {
          const field = issue.path.join(".") || "body";
          return `${field}: ${issue.message}`;
        })
        .join("; ");

      next(new AppError(400, message, "VALIDATION_ERROR"));
      return;
    }

    req.body = result.data;
    next();
  };
}