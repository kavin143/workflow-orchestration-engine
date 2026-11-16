
import argon2 from "argon2";

/**
 * Argon2id settings for securely hashing user passwords.
 *
 * These settings are a practical starting point. Benchmark them
 * on deployment hardware before production release.
 */
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} satisfies Parameters<typeof argon2.hash>[1];

/**
 * Hashes a plaintext password using Argon2id.
 *
 * The encoded result contains the algorithm parameters and salt
 * required to verify the password later.
 *
 * @param password - Plaintext password supplied during registration.
 * @returns The encoded Argon2id hash.
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_OPTIONS);
}

/**
 * Verifies a plaintext password against a stored Argon2 hash.
 *
 * @param password - Plaintext password supplied during login.
 * @param passwordHash - Encoded password hash stored in MongoDB.
 * @returns True when the password matches; otherwise, false.
 */
export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return argon2.verify(passwordHash, password);
}
