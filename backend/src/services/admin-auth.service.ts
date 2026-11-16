import { AppError } from "../errors/app-error.js";
import { findAdminByEmail } from "../repositories/admin.repository.js";
import { verifyPassword } from "../utils/password.js";
import { createAdminAccessToken } from "../utils/jwt.js";
import { adminLoginSchema } from "../validators/admin-auth.validator.js";

export async function adminLogin(input: unknown) {
  const parsed = adminLoginSchema.safeParse(input);

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
  const admin = await findAdminByEmail(email);

  // Use the same response for unknown email and wrong password.
  if (!admin) {
    throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  const passwordMatches = await verifyPassword(password, admin.passwordHash);

  if (!passwordMatches) {
    throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  const accessToken = await createAdminAccessToken({
    adminId: admin._id.toString(),
  });

  return {
    accessToken,
    tokenType: "Bearer",
    expiresIn: 3600,
    admin: {
      id: admin._id.toString(),
      name: admin.name,
      email: admin.email,
    },
  };
}
