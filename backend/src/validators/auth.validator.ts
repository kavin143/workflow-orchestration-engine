
import { z } from "zod";

/**
 * Validation schema for public tenant registration.
 *
 * The client provides workspace and profile details.
 * The server generates the tenant ID and slug.
 * The client must never submit passwordHash, tenantId, or account status.
 */
export const registerSchema = z
  .object({
    /** Name of the new workspace or organization. */
    tenantName: z
      .string()
      .trim()
      .min(2, "Workspace name must contain at least 2 characters")
      .max(100, "Workspace name cannot exceed 100 characters"),

    /** User's first name. */
    firstName: z
      .string()
      .trim()
      .min(2, "First name must contain at least 2 characters")
      .max(50, "First name cannot exceed 50 characters"),

    /** User's last name. */
    lastName: z
      .string()
      .trim()
      .min(1, "Last name must contain at least 1 character")
      .max(50, "Last name cannot exceed 50 characters"),

    /** Email address used for account identification. */
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, "Email is required")
      .max(254, "Email cannot exceed 254 characters")
      .pipe(z.email("Please provide a valid email address")),

    /**
     * Plaintext password received over HTTPS.
     * The registration service must hash it before storage.
     */
    password: z
      .string()
      .min(12, "Password must contain at least 12 characters")
      .max(128, "Password cannot exceed 128 characters")
      .refine(
        (value) => /[a-z]/.test(value),
        "Password must contain a lowercase letter",
      )
      .refine(
        (value) => /[A-Z]/.test(value),
        "Password must contain an uppercase letter",
      )
      .refine(
        (value) => /\d/.test(value),
        "Password must contain a number",
      ),

    /** Optional gender information. */
    gender: z
      .enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"])
      .optional(),

    /** Optional date of birth in YYYY-MM-DD format. */
    dateOfBirth: z
      .iso
      .date("Date of birth must use YYYY-MM-DD format")
      .optional()
      .refine(
        (value) => value === undefined || value <= new Date().toISOString().slice(0, 10),
        "Date of birth cannot be in the future",
      ),
  })
  .strict();

/**
 * Type inferred from the validated registration request.
 * Use this type in the registration service and controller.
 */
export type RegisterInput = z.infer<typeof registerSchema>;
