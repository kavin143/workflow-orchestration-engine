
import mongoose, { Types } from "mongoose";
import WorkflowModel, {
  type Workflow,
  type WorkflowStatus,
} from "../models/workflow.model.js";

export interface WorkflowListFilters {
  tenantId: string;
  search?: string | undefined;
  status?: WorkflowStatus | undefined;
  page: number;
  limit: number;
}

export interface CreateWorkflowInput {
  tenantId: string;
  createdBy: string;
  name: string;
  description: string;
}
export interface UpdateWorkflowInput {
  name?: string | undefined;
  description?: string | undefined;
  status?: WorkflowStatus | undefined;
}

export class WorkflowRepository {
  async create(input: CreateWorkflowInput): Promise<Workflow> {
    const workflow = await WorkflowModel.create({
      tenantId: new Types.ObjectId(input.tenantId),
      createdBy: new Types.ObjectId(input.createdBy),
      name: input.name,
      description: input.description,
      status: "DRAFT",
    });

    return workflow.toObject() as Workflow;
  }

  async findById(
    tenantId: string,
    workflowId: string,
  ): Promise<Workflow | null> {
    if (!mongoose.isValidObjectId(workflowId)) {
      return null;
    }

    return WorkflowModel.findOne({
      _id: workflowId,
      tenantId,
    }).lean<Workflow>().exec();
  }

  async list(filters: WorkflowListFilters): Promise<{
    items: Workflow[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { tenantId, search, status, page, limit } = filters;

    const query: Record<string, unknown> = {
      tenantId: new Types.ObjectId(tenantId),
    };

    if (status) {
      query.status = status;
    }

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { description: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      WorkflowModel.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean<Workflow[]>()
        .exec(),
      WorkflowModel.countDocuments(query).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(
    tenantId: string,
    workflowId: string,
    input: UpdateWorkflowInput,
  ): Promise<Workflow | null> {
    if (!mongoose.isValidObjectId(workflowId)) {
      return null;
    }

    return WorkflowModel.findOneAndUpdate(
      {
        _id: workflowId,
        tenantId: new Types.ObjectId(tenantId),
      },
      { $set: input },
      {
        new: true,
        runValidators: true,
      },
    )
      .lean<Workflow>()
      .exec();
  }

  async archive(
    tenantId: string,
    workflowId: string,
  ): Promise<Workflow | null> {
    if (!mongoose.isValidObjectId(workflowId)) {
      return null;
    }

    return WorkflowModel.findOneAndUpdate(
      {
        _id: workflowId,
        tenantId: new Types.ObjectId(tenantId),
        status: { $ne: "ARCHIVED" },
      },
      { $set: { status: "ARCHIVED" } },
      {
        new: true,
        runValidators: true,
      },
    )
      .lean<Workflow>()
      .exec();
  }
}

export const workflowRepository = new WorkflowRepository();
