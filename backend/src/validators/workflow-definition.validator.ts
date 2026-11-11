import { z } from "zod";

const positionSchema = z
  .object({
    x: z.number(),
    y: z.number(),
  })
  .strict();

const baseNodeFields = {
  id: z.string().trim().min(1, "Node ID is required"),
  name: z.string().trim().min(1, "Node name is required").max(100),
  position: positionSchema,
};

const startOrEndConfigSchema = z.object({}).strict();

const apiRequestConfigSchema = z
  .object({
    method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
    url: z.string().trim().min(1, "URL is required").max(2000),
    headers: z.record(z.string(), z.string()).optional(),
    body: z.string().max(10_000).optional(),
  })
  .strict();

const conditionConfigSchema = z
  .object({
    expression: z.string().trim().min(1, "Expression is required").max(500),
  })
  .strict();

const delayConfigSchema = z
  .object({
    ms: z.coerce.number().int().min(0).max(24 * 60 * 60 * 1000),
  })
  .strict();

const nodeSchema = z.discriminatedUnion("type", [
  z.object({ ...baseNodeFields, type: z.literal("START"), config: startOrEndConfigSchema }).strict(),
  z.object({ ...baseNodeFields, type: z.literal("END"), config: startOrEndConfigSchema }).strict(),
  z.object({ ...baseNodeFields, type: z.literal("API_REQUEST"), config: apiRequestConfigSchema }).strict(),
  z.object({ ...baseNodeFields, type: z.literal("CONDITION"), config: conditionConfigSchema }).strict(),
  z.object({ ...baseNodeFields, type: z.literal("DELAY"), config: delayConfigSchema }).strict(),
]);

const edgeSchema = z
  .object({
    id: z.string().trim().min(1),
    source: z.string().trim().min(1),
    target: z.string().trim().min(1),
    sourceHandle: z.enum(["yes", "no"]).optional(),
  })
  .strict();

export const workflowDefinitionSchema = z
  .object({
    nodes: z.array(nodeSchema).max(100),
    edges: z.array(edgeSchema).max(200),
  })
  .strict();

export type WorkflowDefinitionInput = z.infer<typeof workflowDefinitionSchema>;
