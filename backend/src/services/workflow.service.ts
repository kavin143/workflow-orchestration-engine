
import mongoose from "mongoose";
import { AppError } from "../errors/app-error.js";
import {
  listWorkflowsQuerySchema,
  createWorkflowSchema,
  updateWorkflowSchema,
} from "../validators/workflow.validator.js";
import {
  workflowRepository,
  type UpdateWorkflowInput,
} from "../repositories/workflow.repository.js";

export class WorkflowService {
  async create(
    tenantId: string,
    userId: string,
    input: unknown,
  ) {
    const parsed = createWorkflowSchema.safeParse(input);

    if (!parsed.success) {
      throw new AppError(
        400,
        parsed.error.issues[0]?.message ?? "Invalid workflow input",
        "VALIDATION_ERROR",
      );
    }

    return workflowRepository.create({
      tenantId,
      createdBy: userId,
      name: parsed.data.name,
      description: parsed.data.description,
    });
  }

  async list(tenantId: string, query: unknown) {
    const parsed = listWorkflowsQuerySchema.safeParse(query);

    if (!parsed.success) {
      throw new AppError(
        400,
        parsed.error.issues[0]?.message ?? "Invalid workflow query",
        "VALIDATION_ERROR",
      );
    }

    return workflowRepository.list({
      tenantId,
      ...parsed.data,
    });
  }

  async getById(tenantId: string, workflowId: string) {
    if (!mongoose.isValidObjectId(workflowId)) {
      throw new AppError(400, "Invalid workflow ID", "INVALID_WORKFLOW_ID");
    }

    const workflow = await workflowRepository.findById(tenantId, workflowId);

    if (!workflow) {
      throw new AppError(404, "Workflow not found", "WORKFLOW_NOT_FOUND");
    }

    return workflow;
  }

  async update(
    tenantId: string,
    workflowId: string,
    input: unknown,
  ) {
    if (!mongoose.isValidObjectId(workflowId)) {
      throw new AppError(400, "Invalid workflow ID", "INVALID_WORKFLOW_ID");
    }

    const parsed = updateWorkflowSchema.safeParse(input);

    if (!parsed.success) {
      throw new AppError(
        400,
        parsed.error.issues[0]?.message ?? "Invalid workflow update",
        "VALIDATION_ERROR",
      );
    }

    const existing = await workflowRepository.findById(tenantId, workflowId);

    if (!existing) {
      throw new AppError(404, "Workflow not found", "WORKFLOW_NOT_FOUND");
    }

    if (existing.status === "ARCHIVED") {
      throw new AppError(
        409,
        "Archived workflows cannot be updated",
        "WORKFLOW_ARCHIVED",
      );
    }

    const changes: UpdateWorkflowInput = parsed.data;
    const updated = await workflowRepository.update(
      tenantId,
      workflowId,
      changes,
    );

    if (!updated) {
      throw new AppError(404, "Workflow not found", "WORKFLOW_NOT_FOUND");
    }

    return updated;
  }

  async archive(tenantId: string, workflowId: string) {
    if (!mongoose.isValidObjectId(workflowId)) {
      throw new AppError(400, "Invalid workflow ID", "INVALID_WORKFLOW_ID");
    }

    const existing = await workflowRepository.findById(tenantId, workflowId);

    if (!existing) {
      throw new AppError(404, "Workflow not found", "WORKFLOW_NOT_FOUND");
    }

    if (existing.status === "ARCHIVED") {
      throw new AppError(
        409,
        "Workflow is already archived",
        "WORKFLOW_ALREADY_ARCHIVED",
      );
    }

    const archived = await workflowRepository.archive(tenantId, workflowId);

    if (!archived) {
      throw new AppError(404, "Workflow not found", "WORKFLOW_NOT_FOUND");
    }

    return archived;
  }
}

export const workflowService = new WorkflowService();