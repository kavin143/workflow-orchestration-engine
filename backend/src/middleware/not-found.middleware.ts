import type { RequestHandler } from "express";

/**
 * Handles requests that do not match any registered route.
 */
export const notFoundMiddleware: RequestHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "ROUTE_NOT_FOUND",
      message: `Route ${req.method} ${req.originalUrl} was not found`,
    },
  });
};