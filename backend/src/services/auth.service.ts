
import mongoose from "mongoose";

import { AppError } from "../errors/app-error.js";
import {
  createTenantRegistration,
  type CreateTenantRegistrationInput,
} from "../repositories/auth.repository.js";
import { registerSchema } from "../validators/auth.validator.js";
import { hashPassword } from "../utils/password.js";

/**
 * Public representation of a registered tenant.
 *
 * Internal database details are deliberately excluded.
 */
export interface RegisteredTenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: Date;
}

/**
 * Public representation of a registered user.
 *
 * Passwords and password hashes must never be included in API responses.
 */
export interface RegisteredUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  tenantId: string;
  gender?: string;
  dateOfBirth?: Date;
  status: string;
  createdAt: Date;
}

/**
 * Successful registration result returned to the controller.
 */
export interface RegisterResult {
  tenant: RegisteredTenant;
  user: RegisteredUser;
}

/**
 * Converts a workspace name into a URL-friendly tenant slug.
 *
 * This function only normalizes the name. The registration service
 * adds a unique suffix to reduce slug collisions.
 */
function createTenantSlug(name: string): string {
  const normalized = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");

  // Use a safe fallback for names without ASCII letters or numbers.
  return normalized.length >= 2 ? normalized : "workspace";
}

/**
 * Creates a new tenant and its first user.
 *
 * The request is validated before any database operation.
 * The password is hashed before it is passed to the repository.
 * The tenant ID and slug are generated on the server.
 *
 * The repository creates both documents in a single transaction.
 *
 * @param input - Untrusted registration request body.
 * @returns Safe tenant and user information.
 * @throws AppError for invalid input or known registration conflicts.
 */
export async function registerUser(
  input: unknown,
): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(input);

  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => {
        const field = issue.path.join(".") || "body";
        return `${field}: ${issue.message}`;
      })
      .join("; ");

    throw new AppError(400, message, "VALIDATION_ERROR");
  }

  const data = parsed.data;

  // Hash the password before writing anything to the database.
  const passwordHash = await hashPassword(data.password);

  // Generate a mostly unique slug. The database unique index remains
  // the final authority for enforcing uniqueness.
  const slugBase = createTenantSlug(data.tenantName);
  const tenantSlug = `${slugBase}-${new mongoose.Types.ObjectId().toHexString().slice(-8)}`;

  const registrationInput: CreateTenantRegistrationInput = {
    tenantName: data.tenantName,
    tenantSlug,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    passwordHash,
    ...(data.gender !== undefined && {
      gender: data.gender,
    }),
    ...(data.dateOfBirth !== undefined && {
      dateOfBirth: new Date(`${data.dateOfBirth}T00:00:00.000Z`),
    }),
  };

  try {
    const result = await createTenantRegistration(registrationInput);

    // Explicitly map database documents to public response objects.
    // Never serialize a full database document as the API response.
    const tenant: RegisteredTenant = {
      id: result.tenant._id.toString(),
      name: result.tenant.name,
      slug: result.tenant.slug,
      status: result.tenant.status,
      createdAt: result.tenant.createdAt,
    };

    const user: RegisteredUser = {
      id: result.user._id.toString(),
      firstName: result.user.firstName,
      lastName: result.user.lastName,
      email: result.user.email,
      tenantId: result.user.tenantId.toString(),
      status: result.user.status,
      createdAt: result.user.createdAt,
      ...(result.user.gender !== undefined && {
        gender: result.user.gender,
      }),
      ...(result.user.dateOfBirth !== undefined && {
        dateOfBirth: result.user.dateOfBirth,
      }),
    };

    return { tenant, user };
  } catch (error: unknown) {
    // MongoDB duplicate-key errors use code 11000.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      const duplicateError = error as {
        keyPattern?: Record<string, unknown>;
      };

      if (duplicateError.keyPattern?.email !== undefined) {
        throw new AppError(
          409,
          "An account with this email already exists",
          "EMAIL_ALREADY_EXISTS",
        );
      }

      if (duplicateError.keyPattern?.slug !== undefined) {
        throw new AppError(
          409,
          "Unable to allocate a unique workspace identifier. Please retry.",
          "TENANT_SLUG_CONFLICT",
        );
      }

      throw new AppError(
        409,
        "A registration conflict occurred",
        "REGISTRATION_CONFLICT",
      );
    }

    // Let the centralized error middleware handle unexpected failures.
    throw error;
  }
}
