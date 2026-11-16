import { AppError } from "../errors/app-error.js";
import {
  findTenantById,
  findUserByEmail,
} from "../repositories/auth.repository.js";
import { verifyPassword } from "../utils/password.js";
import { createAccessToken } from "../utils/jwt.js";
import { loginSchema } from "../validators/login.validator.js";

export async function loginUser(input: unknown) {
  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => {
        const field = issue.path.join(".") || "body";
        return `${field}: ${issue.message}`;
      })
      .join("; ");

    throw new AppError(400, message, "VALIDATION_ERROR");
  }

  const { email, password } = parsed.data;
  const user = await findUserByEmail(email);

  // Use the same response for unknown email and wrong password.
  if (!user) {
    throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  const passwordMatches = await verifyPassword(
    password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  if (user.status !== "ACTIVE") {
    throw new AppError(403, "This account is disabled", "ACCOUNT_DISABLED");
  }

  const tenant = await findTenantById(user.tenantId.toString());

  if (!tenant || tenant.status !== "ACTIVE") {
    throw new AppError(403, "This workspace is disabled", "TENANT_DISABLED");
  }

  const accessToken = await createAccessToken({
    userId: user._id.toString(),
    tenantId: user.tenantId.toString(),
  });

  return {
    accessToken,
    tokenType: "Bearer",
    expiresIn: 3600,
    user: {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      tenantId: user.tenantId.toString(),
      status: user.status,
    },
    tenant: {
      id: tenant._id.toString(),
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
    },
  };
}