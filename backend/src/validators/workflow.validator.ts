import { z } from "zod";

import { WORKFLOW_STATUSES } from "../models/workflow.model.js";

export const createWorkflowSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Workflow name must contain at least 3 characters")
      .max(100, "Workflow name cannot exceed 100 characters"),

    description: z
      .string()
      .trim()
      .max(1000, "Description cannot exceed 1000 characters")
      .default(""),
  })
  .strict();

export const updateWorkflowSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3)
      .max(100)
      .optional(),

    description: z
      .string()
      .trim()
      .max(1000)
      .optional(),

    status: z.enum(WORKFLOW_STATUSES).optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Provide at least one field to update",
  );

export const listWorkflowsQuerySchema = z
  .object({
    search: z.string().trim().max(100).optional(),
    status: z.enum(WORKFLOW_STATUSES).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  })
  .strict();