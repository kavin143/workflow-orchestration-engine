import { z } from "zod";

import { EXECUTION_STATUSES } from "../models/execution.model.js";

export const listExecutionsQuerySchema = z
  .object({
    workflowId: z.string().trim().min(1).optional(),
    status: z.enum(EXECUTION_STATUSES).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  })
  .strict();
