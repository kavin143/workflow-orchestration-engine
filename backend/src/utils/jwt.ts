import { SignJWT } from "jose";

import { env } from "../config/env.js";

const secret = new TextEncoder().encode(env.JWT_SECRET);

/**
 * Issues a signed access token for an authenticated user.
 */
export async function createAccessToken(input: {
  userId: string;
  tenantId: string;
}): Promise<string> {
  return new SignJWT({
    tenantId: input.tenantId,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(input.userId)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret);
}

/**
 * Issues a signed access token for an authenticated platform admin.
 *
 * The "role" claim is what distinguishes an admin token from a
 * tenant-user token: admin tokens carry no tenantId, and tenant-user
 * tokens carry no role, so neither can be used in place of the other.
 */
export async function createAdminAccessToken(input: {
  adminId: string;
}): Promise<string> {
  return new SignJWT({
    role: "ADMIN",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(input.adminId)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret);
}