
import mongoose from "mongoose";
import { AppError } from "../errors/app-error.js";
import {
  listAdminUsersQuerySchema,
  updateUserStatusSchema,
} from "../validators/admin-user.validator.js";
import { adminUserRepository } from "../repositories/admin-user.repository.js";

export class AdminUserService {
  async list(query: unknown) {
    const parsed = listAdminUsersQuerySchema.safeParse(query);

    if (!parsed.success) {
      throw new AppError(
        400,
        parsed.error.issues[0]?.message ?? "Invalid user query",
        "VALIDATION_ERROR",
      );
    }

    return adminUserRepository.list(parsed.data);
  }

  async getById(userId: string) {
    if (!mongoose.isValidObjectId(userId)) {
      throw new AppError(400, "Invalid user ID", "INVALID_USER_ID");
    }

    const user = await adminUserRepository.findById(userId);

    if (!user) {
      throw new AppError(404, "User not found", "USER_NOT_FOUND");
    }

    return user;
  }

  async updateStatus(userId: string, input: unknown) {
    if (!mongoose.isValidObjectId(userId)) {
      throw new AppError(400, "Invalid user ID", "INVALID_USER_ID");
    }

    const parsed = updateUserStatusSchema.safeParse(input);

    if (!parsed.success) {
      throw new AppError(
        400,
        parsed.error.issues[0]?.message ?? "Invalid status update",
        "VALIDATION_ERROR",
      );
    }

    const updated = await adminUserRepository.updateStatus(
      userId,
      parsed.data.status,
    );

    if (!updated) {
      throw new AppError(404, "User not found", "USER_NOT_FOUND");
    }

    return updated;
  }

  async remove(userId: string) {
    if (!mongoose.isValidObjectId(userId)) {
      throw new AppError(400, "Invalid user ID", "INVALID_USER_ID");
    }

    const deleted = await adminUserRepository.deleteById(userId);

    if (!deleted) {
      throw new AppError(404, "User not found", "USER_NOT_FOUND");
    }

    return deleted;
  }
}

export const adminUserService = new AdminUserService();
