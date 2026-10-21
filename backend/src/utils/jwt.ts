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