
import mongoose, { Types } from "mongoose";
import ExecutionModel, {
  type Execution,
  type ExecutionStatus,
  type NodeRun,
} from "../models/execution.model.js";
import type { WorkflowDefinition } from "../engine/types.js";

export interface CreateExecutionInput {
  tenantId: string;
  workflowId: string;
  workflowName: string;
  triggeredBy: string;
  definition: WorkflowDefinition;
}

export interface ExecutionListFilters {
  tenantId: string;
  workflowId?: string | undefined;
  status?: ExecutionStatus | undefined;
  page: number;
  limit: number;
}

export interface DailyExecutionCount {
  date: string;
  success: number;
  failed: number;
  running: number;
}

export interface ExecutionSummary {
  total: number;
  pending: number;
  running: number;
  success: number;
  failed: number;
  last7Days: DailyExecutionCount[];
}

export async function createExecution(
  input: CreateExecutionInput,
): Promise<Execution & { _id: Types.ObjectId }> {
  const nodeRuns: NodeRun[] = input.definition.nodes.map((node) => ({
    nodeId: node.id,
    name: node.name,
    type: node.type,
    status: "PENDING",
    attempt: 0,
    maxAttempts: 3,
  }));

  const execution = await ExecutionModel.create({
    tenantId: new Types.ObjectId(input.tenantId),
    workflowId: new Types.ObjectId(input.workflowId),
    workflowName: input.workflowName,
    triggeredBy: new Types.ObjectId(input.triggeredBy),
    definition: input.definition,
    status: "PENDING",
    nodeRuns,
    logs: [{ timestamp: new Date(), message: "Workflow run created" }],
  });

  return execution.toObject();
}

/** Used internally by the engine, which already holds a trusted execution id. */
export async function findExecutionById(
  executionId: string,
): Promise<(Execution & { _id: Types.ObjectId }) | null> {
  if (!mongoose.isValidObjectId(executionId)) {
    return null;
  }

  return ExecutionModel.findById(executionId)
    .lean<Execution & { _id: Types.ObjectId }>()
    .exec();
}

export async function findExecutionByIdForTenant(
  tenantId: string,
  executionId: string,
): Promise<(Execution & { _id: Types.ObjectId }) | null> {
  if (!mongoose.isValidObjectId(executionId)) {
    return null;
  }

  return ExecutionModel.findOne({ _id: executionId, tenantId })
    .lean<Execution & { _id: Types.ObjectId }>()
    .exec();
}

export async function listExecutions(filters: ExecutionListFilters): Promise<{
  items: Execution[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const { tenantId, workflowId, status, page, limit } = filters;

  const query: Record<string, unknown> = {
    tenantId: new Types.ObjectId(tenantId),
  };

  if (workflowId) {
    query.workflowId = new Types.ObjectId(workflowId);
  }

  if (status) {
    query.status = status;
  }

  const [items, total] = await Promise.all([
    ExecutionModel.find(query)
      .select("-definition -logs")
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<Execution[]>()
      .exec(),
    ExecutionModel.countDocuments(query).exec(),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateNodeRun(
  executionId: string,
  nodeId: string,
  changes: Partial<NodeRun>,
): Promise<void> {
  const set: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(changes)) {
    set[`nodeRuns.$.${key}`] = value;
  }

  await ExecutionModel.updateOne(
    { _id: executionId, "nodeRuns.nodeId": nodeId },
    { $set: set },
  ).exec();

  if (changes.status === "RUNNING" && !(await isExecutionStarted(executionId))) {
    await ExecutionModel.updateOne(
      { _id: executionId },
      { $set: { status: "RUNNING" } },
    ).exec();
  }
}

async function isExecutionStarted(executionId: string): Promise<boolean> {
  const execution = await ExecutionModel.findById(executionId)
    .select("status")
    .lean<{ status: ExecutionStatus }>()
    .exec();

  return execution?.status === "RUNNING";
}

export async function appendLog(
  executionId: string,
  message: string,
): Promise<void> {
  await ExecutionModel.updateOne(
    { _id: executionId },
    { $push: { logs: { timestamp: new Date(), message } } },
  ).exec();
}

export async function finishExecution(
  executionId: string,
  status: Extract<ExecutionStatus, "SUCCESS" | "FAILED">,
): Promise<void> {
  await ExecutionModel.updateOne(
    { _id: executionId },
    { $set: { status, finishedAt: new Date() } },
  ).exec();
}

export async function getExecutionSummary(
  tenantId: string,
): Promise<ExecutionSummary> {
  const tenantObjectId = new Types.ObjectId(tenantId);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [statusRows, dailyRows] = await Promise.all([
    ExecutionModel.aggregate<{ _id: ExecutionStatus; count: number }>([
      { $match: { tenantId: tenantObjectId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    ExecutionModel.aggregate<{ _id: { date: string; status: ExecutionStatus }; count: number }>([
      { $match: { tenantId: tenantObjectId, startedAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$startedAt" } },
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const summary: ExecutionSummary = {
    total: 0,
    pending: 0,
    running: 0,
    success: 0,
    failed: 0,
    last7Days: [],
  };

  for (const row of statusRows) {
    summary.total += row.count;

    if (row._id === "PENDING") summary.pending = row.count;
    if (row._id === "RUNNING") summary.running = row.count;
    if (row._id === "SUCCESS") summary.success = row.count;
    if (row._id === "FAILED") summary.failed = row.count;
  }

  const byDate = new Map<string, DailyExecutionCount>();

  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    byDate.set(date, { date, success: 0, failed: 0, running: 0 });
  }

  for (const row of dailyRows) {
    const bucket = byDate.get(row._id.date);

    if (!bucket) continue;

    if (row._id.status === "SUCCESS") bucket.success += row.count;
    else if (row._id.status === "FAILED") bucket.failed += row.count;
    else bucket.running += row.count;
  }

  summary.last7Days = Array.from(byDate.values());

  return summary;
}
