
import mongoose from "mongoose";
import { AppError } from "../errors/app-error.js";
import { listExecutionsQuerySchema } from "../validators/execution.validator.js";
import { validateGraph } from "../engine/graph.js";
import type { WorkflowDefinition } from "../engine/types.js";
import { workflowRepository } from "../repositories/workflow.repository.js";
import { createJob } from "../repositories/job.repository.js";
import {
  createExecution,
  findExecutionByIdForTenant,
  getExecutionSummary,
  listExecutions,
} from "../repositories/execution.repository.js";

export class ExecutionService {
  async summary(tenantId: string) {
    return getExecutionSummary(tenantId);
  }

  async run(tenantId: string, userId: string, workflowId: string) {
    if (!mongoose.isValidObjectId(workflowId)) {
      throw new AppError(400, "Invalid workflow ID", "INVALID_WORKFLOW_ID");
    }

    const workflow = await workflowRepository.findById(tenantId, workflowId);

    if (!workflow) {
      throw new AppError(404, "Workflow not found", "WORKFLOW_NOT_FOUND");
    }

    const definition = workflow.definition as WorkflowDefinition;
    const { valid, errors } = validateGraph(definition);

    if (!valid) {
      throw new AppError(
        409,
        `Workflow definition is invalid: ${errors.join("; ")}`,
        "INVALID_DEFINITION",
      );
    }

    const startNode = definition.nodes.find((node) => node.type === "START");

    if (!startNode) {
      throw new AppError(409, "Workflow has no Start node", "INVALID_DEFINITION");
    }

    const execution = await createExecution({
      tenantId,
      workflowId,
      workflowName: workflow.name,
      triggeredBy: userId,
      definition,
    });

    await createJob(execution._id.toString(), startNode.id);

    return execution;
  }

  async list(tenantId: string, query: unknown) {
    const parsed = listExecutionsQuerySchema.safeParse(query);

    if (!parsed.success) {
      throw new AppError(
        400,
        parsed.error.issues[0]?.message ?? "Invalid execution query",
        "VALIDATION_ERROR",
      );
    }

    return listExecutions({ tenantId, ...parsed.data });
  }

  async getById(tenantId: string, executionId: string) {
    if (!mongoose.isValidObjectId(executionId)) {
      throw new AppError(400, "Invalid execution ID", "INVALID_EXECUTION_ID");
    }

    const execution = await findExecutionByIdForTenant(tenantId, executionId);

    if (!execution) {
      throw new AppError(404, "Execution not found", "EXECUTION_NOT_FOUND");
    }

    return execution;
  }

  async rerun(tenantId: string, userId: string, executionId: string) {
    const previous = await this.getById(tenantId, executionId);

    const definition = previous.definition;
    const startNode = definition.nodes.find((node) => node.type === "START");

    if (!startNode) {
      throw new AppError(409, "Workflow has no Start node", "INVALID_DEFINITION");
    }

    const execution = await createExecution({
      tenantId,
      workflowId: previous.workflowId.toString(),
      workflowName: previous.workflowName,
      triggeredBy: userId,
      definition,
    });

    await createJob(execution._id.toString(), startNode.id);

    return execution;
  }
}

export const executionService = new ExecutionService();
