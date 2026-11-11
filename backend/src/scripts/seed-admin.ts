
/**
 * One-time script that creates the first platform admin account.
 *
 * Run with: npm run seed:admin
 *
 * Reads ADMIN_SEED_NAME, ADMIN_SEED_EMAIL, and ADMIN_SEED_PASSWORD from
 * the environment (see .env). Does nothing if an admin with that email
 * already exists.
 */
import { env } from "../config/env.js";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import AdminModel from "../models/admin.model.js";
import { hashPassword } from "../utils/password.js";

async function seedAdmin(): Promise<void> {
  const name = env.ADMIN_SEED_NAME;
  const email = env.ADMIN_SEED_EMAIL;
  const password = env.ADMIN_SEED_PASSWORD;

  if (!name || !email || !password) {
    console.error(
      "ADMIN_SEED_NAME, ADMIN_SEED_EMAIL, and ADMIN_SEED_PASSWORD must be set in the environment to seed an admin.",
    );
    process.exitCode = 1;
    return;
  }

  await connectDatabase();

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await AdminModel.findOne({ email: normalizedEmail });

    if (existing) {
      console.info(`An admin with email "${normalizedEmail}" already exists. Nothing to do.`);
      return;
    }

    const passwordHash = await hashPassword(password);

    await AdminModel.create({
      name,
      email: normalizedEmail,
      passwordHash,
    });

    console.info(`Admin account "${normalizedEmail}" created successfully.`);
  } finally {
    await disconnectDatabase();
  }
}

seedAdmin().catch((error: unknown) => {
  console.error("Failed to seed admin account:", error);
  process.exitCode = 1;
});
