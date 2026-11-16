import type { RequestHandler } from "express";
import mongoose from "mongoose";
import { z } from "zod";

import { AppError } from "../errors/app-error.js";
import {
  getAdminOverview,
  listAdminExecutions,
  listAdminTenants,
  updateTenantStatus,
} from "../repositories/admin-stats.repository.js";

const pageQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.string().trim().max(20).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

const tenantStatusSchema = z.object({
  status: z.enum(["ACTIVE", "DISABLED"]),
});

function parsePage(query: unknown) {
  const parsed = pageQuerySchema.safeParse(query);

  if (!parsed.success) {
    throw new AppError(
      400,
      parsed.error.issues[0]?.message ?? "Invalid query",
      "VALIDATION_ERROR",
    );
  }

  return parsed.data;
}

export const adminOverviewController: RequestHandler = async (_req, res, next) => {
  try {
    res.status(200).json({ success: true, data: await getAdminOverview() });
  } catch (error: unknown) {
    next(error);
  }
};

export const adminTenantsController: RequestHandler = async (req, res, next) => {
  try {
    res
      .status(200)
      .json({ success: true, data: await listAdminTenants(parsePage(req.query)) });
  } catch (error: unknown) {
    next(error);
  }
};

export const adminTenantStatusController: RequestHandler = async (req, res, next) => {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : "";

    if (!mongoose.isValidObjectId(id)) {
      throw new AppError(400, "Invalid tenant ID", "INVALID_TENANT_ID");
    }

    const parsed = tenantStatusSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(400, "Status must be ACTIVE or DISABLED", "VALIDATION_ERROR");
    }

    const tenant = await updateTenantStatus(id, parsed.data.status);

    if (!tenant) {
      throw new AppError(404, "Tenant not found", "TENANT_NOT_FOUND");
    }

    res.status(200).json({ success: true, data: tenant });
  } catch (error: unknown) {
    next(error);
  }
};

export const adminExecutionsController: RequestHandler = async (req, res, next) => {
  try {
    res
      .status(200)
      .json({ success: true, data: await listAdminExecutions(parsePage(req.query)) });
  } catch (error: unknown) {
    next(error);
  }
};
