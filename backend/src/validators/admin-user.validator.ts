import { z } from "zod";

import { USER_STATUSES } from "../models/user.model.js";

export const listAdminUsersQuerySchema = z
  .object({
    search: z.string().trim().max(100).optional(),
    status: z.enum(USER_STATUSES).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  })
  .strict();

export const updateUserStatusSchema = z
  .object({
    status: z.enum(USER_STATUSES),
  })
  .strict();
