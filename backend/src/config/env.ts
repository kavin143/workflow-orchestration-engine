import "dotenv/config";
import { z } from "zod";

/**
 * Defines and validates the environment variables required by the backend.
 *
 * This module is the single source of truth for application configuration.
 * Invalid configuration causes startup to fail instead of allowing the
 * application to run with missing or incorrect settings.
 */
const envSchema = z.object({
  // Controls environment-specific behavior.
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // TCP port used by the HTTP server.
  PORT: z.coerce
    .number()
    .int()
    .min(1)
    .max(65535)
    .default(5000),

  // MongoDB connection string. Keep credentials out of source code.
  MONGODB_URI: z
    .string()
    .trim()
    .min(1, "MONGODB_URI must be configured"),
});

/**
 * Parse process.env once and expose only validated configuration.
 * Zod throws a validation error if any supplied value is invalid.
 */
export const env = envSchema.parse(process.env);