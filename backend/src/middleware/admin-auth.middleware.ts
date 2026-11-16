import type { RequestHandler } from "express";
import { jwtVerify } from "jose";
import mongoose from "mongoose";

import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";
import AdminModel from "../models/admin.model.js";

declare global {
  namespace Express {
    interface Request {
      adminAuth?: {
        adminId: string;
      };
    }
  }
}

const secret = new TextEncoder().encode(env.JWT_SECRET);

export const requireAdminAuth: RequestHandler = async (
  req,
  _res,
  next,
) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      throw new AppError(
        401,
        "Authentication token is required",
        "AUTHENTICATION_REQUIRED",
      );
    }

    const token = authorization.slice("Bearer ".length).trim();

    if (!token) {
      throw new AppError(
        401,
        "Authentication token is required",
        "AUTHENTICATION_REQUIRED",
      );
    }

    let payload;

    try {
      const result = await jwtVerify(token, secret, {
        algorithms: ["HS256"],
      });

      payload = result.payload;
    } catch {
      throw new AppError(
        401,
        "Invalid or expired authentication token",
        "INVALID_TOKEN",
      );
    }

    const adminId = payload.sub;

    if (
      payload.role !== "ADMIN" ||
      typeof adminId !== "string" ||
      !mongoose.isValidObjectId(adminId)
    ) {
      throw new AppError(
        401,
        "Invalid authentication token claims",
        "INVALID_TOKEN",
      );
    }

    // Recheck that the admin still exists so a deleted admin cannot
    // keep using a previously issued access token.
    const admin = await AdminModel.findById(adminId).select("_id").lean();

    if (!admin) {
      throw new AppError(
        401,
        "Admin account is unavailable",
        "ACCOUNT_UNAVAILABLE",
      );
    }

    req.adminAuth = {
      adminId,
    };

    next();
  } catch (error: unknown) {
    next(error);
  }
};
