
import mongoose from "mongoose";

import UserModel, { type User, type UserStatus } from "../models/user.model.js";

export interface AdminUserListFilters {
  search?: string | undefined;
  status?: UserStatus | undefined;
  page: number;
  limit: number;
}

export class AdminUserRepository {
  async list(filters: AdminUserListFilters): Promise<{
    items: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { search, status, page, limit } = filters;

    const query: Record<string, unknown> = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { firstName: { $regex: escapedSearch, $options: "i" } },
        { lastName: { $regex: escapedSearch, $options: "i" } },
        { email: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      UserModel.find(query)
        .populate("tenantId", "name slug")
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean<User[]>()
        .exec(),
      UserModel.countDocuments(query).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(userId: string): Promise<User | null> {
    if (!mongoose.isValidObjectId(userId)) {
      return null;
    }

    return UserModel.findById(userId)
      .populate("tenantId", "name slug")
      .lean<User>()
      .exec();
  }

  async updateStatus(
    userId: string,
    status: UserStatus,
  ): Promise<User | null> {
    if (!mongoose.isValidObjectId(userId)) {
      return null;
    }

    return UserModel.findByIdAndUpdate(
      userId,
      { $set: { status } },
      { new: true, runValidators: true },
    )
      .populate("tenantId", "name slug")
      .lean<User>()
      .exec();
  }

  async deleteById(userId: string): Promise<User | null> {
    if (!mongoose.isValidObjectId(userId)) {
      return null;
    }

    return UserModel.findByIdAndDelete(userId).lean<User>().exec();
  }
}

export const adminUserRepository = new AdminUserRepository();
