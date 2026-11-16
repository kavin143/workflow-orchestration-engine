
import mongoose from "mongoose";

import AdminModel from "../models/admin.model.js";

/**
 * Finds an admin by normalized email for authentication.
 *
 * The password hash is explicitly selected because the Admin schema
 * excludes it from ordinary query results.
 */
export async function findAdminByEmail(email: string) {
  return AdminModel.findOne({
    email: email.trim().toLowerCase(),
  }).select("+passwordHash");
}

/**
 * Finds an admin by document ID. The password hash remains excluded.
 */
export async function findAdminById(adminId: string) {
  if (!mongoose.isValidObjectId(adminId)) {
    return null;
  }

  return AdminModel.findById(adminId);
}
