
import mongoose from "mongoose";

import TenantModel, { type Tenant } from "../models/tenant.model.js";
import UserModel, { type User } from "../models/user.model.js";

/**
 * Data required to create a tenant and its first user.
 *
 * The caller must provide a server-generated tenant slug and
 * a password hash. This repository never hashes plaintext passwords.
 */
export interface CreateTenantRegistrationInput {
  tenantName: string;
  tenantSlug: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  gender?: User["gender"];
  dateOfBirth?: Date;
}

/**
 * Documents created during successful registration.
 *
 * Password hashes are excluded from the returned user document
 * by the User schema's select:false setting, but this repository
 * still returns only what the service needs to construct a safe response.
 */
export interface TenantRegistrationResult {
  tenant: InstanceType<typeof TenantModel>;
  user: InstanceType<typeof UserModel>;
}

/**
 * Creates a tenant and its first user atomically.
 *
 * Both inserts use the same MongoDB session. If either insert fails,
 * the transaction is aborted so neither document is committed.
 *
 * MongoDB transactions require a replica set or a sharded cluster.
 * A standalone MongoDB server does not support multi-document transactions.
 *
 * @param input - Validated registration data and server-generated values.
 * @returns The newly created tenant and user documents.
 */
export async function createTenantRegistration(
  input: CreateTenantRegistrationInput,
): Promise<TenantRegistrationResult> {
  const session = await mongoose.startSession();

  let createdTenant: TenantRegistrationResult["tenant"] | undefined;
  let createdUser: TenantRegistrationResult["user"] | undefined;

  try {
    await session.withTransaction(async () => {
      const tenants = await TenantModel.create(
        [
          {
            name: input.tenantName,
            slug: input.tenantSlug,
            status: "ACTIVE",
          },
        ],
        { session },
      );

      const tenant = tenants[0];

      if (!tenant) {
        throw new Error("Tenant creation did not return a document");
      }

      const userData: Omit<User, "createdAt" | "updatedAt"> = {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        passwordHash: input.passwordHash,
        tenantId: tenant._id,
        status: "ACTIVE",
        ...(input.gender !== undefined && {
          gender: input.gender,
        }),
        ...(input.dateOfBirth !== undefined && {
          dateOfBirth: input.dateOfBirth,
        }),
      };

      const users = await UserModel.create([userData], { session });
      const user = users[0];

      if (!user) {
        throw new Error("User creation did not return a document");
      }

      createdTenant = tenant;
      createdUser = user;
    });

    if (!createdTenant || !createdUser) {
      throw new Error("Registration transaction completed without creating both documents");
    }

    return {
      tenant: createdTenant,
      user: createdUser,
    };
  } finally {
    await session.endSession();
  }
}


/**
 * Finds a user by normalized email for authentication.
 *
 * The password hash is explicitly selected because the User schema
 * excludes it from ordinary query results.
 *
 * The caller must verify the password and check account status.
 *
 * @param email - Normalized email address.
 * @returns The user with passwordHash, or null if not found.
 */
export async function findUserByEmail(email: string) {
  return UserModel.findOne({
    email: email.trim().toLowerCase(),
  }).select("+passwordHash");
}

/**
 * Finds a user by document ID.
 *
 * The password hash remains excluded from the result.
 *
 * @param userId - MongoDB user document ID.
 * @returns The user, or null if not found.
 */
export async function findUserById(userId: string) {
  if (!mongoose.isValidObjectId(userId)) {
    return null;
  }

  return UserModel.findById(userId);
}

/**
 * Finds a tenant by document ID.
 *
 * @param tenantId - MongoDB tenant document ID.
 * @returns The tenant, or null if not found.
 */
export async function findTenantById(tenantId: string) {
  if (!mongoose.isValidObjectId(tenantId)) {
    return null;
  }

  return TenantModel.findById(tenantId);
}

/**
 * Finds a tenant by its normalized slug.
 *
 * @param slug - URL-friendly tenant identifier.
 * @returns The tenant, or null if not found.
 */
export async function findTenantBySlug(slug: string) {
  return TenantModel.findOne({
    slug: slug.trim().toLowerCase(),
  });
}
