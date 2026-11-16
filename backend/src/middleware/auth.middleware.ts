import type { RequestHandler } from "express";
import { jwtVerify } from "jose";
import mongoose from "mongoose";

import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";
import TenantModel from "../models/tenant.model.js";
import UserModel from "../models/user.model.js";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        tenantId: string;
      };
    }
  }
}

const secret = new TextEncoder().encode(env.JWT_SECRET);

export const requireAuth: RequestHandler = async (
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

    const userId = payload.sub;
    const tenantId = payload.tenantId;

    if (
      typeof userId !== "string" ||
      typeof tenantId !== "string" ||
      !mongoose.isValidObjectId(userId) ||
      !mongoose.isValidObjectId(tenantId)
    ) {
      throw new AppError(
        401,
        "Invalid authentication token claims",
        "INVALID_TOKEN",
      );
    }

    // Recheck account status so disabled accounts cannot keep using
    // previously issued access tokens.
    const user = await UserModel.findOne({
      _id: userId,
      tenantId,
      status: "ACTIVE",
    })
      .select("_id tenantId")
      .lean();

    if (!user) {
      throw new AppError(
        401,
        "User account is unavailable",
        "ACCOUNT_UNAVAILABLE",
      );
    }

    const tenant = await TenantModel.findOne({
      _id: tenantId,
      status: "ACTIVE",
    })
      .select("_id")
      .lean();

    if (!tenant) {
      throw new AppError(
        403,
        "Workspace is disabled or unavailable",
        "TENANT_UNAVAILABLE",
      );
    }

    req.auth = {
      userId,
      tenantId,
    };

    next();
  } catch (error: unknown) {
    next(error);
  }
};