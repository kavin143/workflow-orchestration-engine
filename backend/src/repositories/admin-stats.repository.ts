import mongoose, { Types } from "mongoose";

import TenantModel from "../models/tenant.model.js";
import UserModel from "../models/user.model.js";
import WorkflowModel from "../models/workflow.model.js";
import ExecutionModel, {
  type ExecutionStatus,
} from "../models/execution.model.js";
import JobModel from "../models/job.model.js";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface AdminOverview {
  tenants: { total: number; active: number; disabled: number };
  users: { total: number; active: number; disabled: number };
  workflows: { total: number; active: number };
  executions: {
    total: number;
    pending: number;
    running: number;
    success: number;
    failed: number;
    successRate: number;
    avgDurationMs: number;
  };
  queue: { pending: number; processing: number };
  last7Days: { date: string; success: number; failed: number; running: number }[];
  topTenants: { tenantId: string; name: string; executions: number }[];
  recentFailures: {
    _id: string;
    workflowName: string;
    tenantName: string;
    startedAt: Date;
    error: string;
  }[];
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const since = new Date(Date.now() - 7 * DAY_MS);

  const [
    tenantRows,
    userRows,
    workflowTotal,
    workflowActive,
    execRows,
    durationRows,
    queueRows,
    dailyRows,
    topRows,
    failures,
  ] = await Promise.all([
    TenantModel.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    UserModel.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    WorkflowModel.countDocuments({ status: { $ne: "ARCHIVED" } }),
    WorkflowModel.countDocuments({ status: "ACTIVE" }),
    ExecutionModel.aggregate<{ _id: ExecutionStatus; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    ExecutionModel.aggregate<{ _id: null; avg: number }>([
      { $match: { finishedAt: { $exists: true } } },
      {
        $group: {
          _id: null,
          avg: { $avg: { $subtract: ["$finishedAt", "$startedAt"] } },
        },
      },
    ]),
    JobModel.aggregate<{ _id: string; count: number }>([
      { $match: { status: { $in: ["PENDING", "PROCESSING"] } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    ExecutionModel.aggregate<{
      _id: { date: string; status: ExecutionStatus };
      count: number;
    }>([
      { $match: { startedAt: { $gte: since } } },
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
    ExecutionModel.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $group: { _id: "$tenantId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    ExecutionModel.find({ status: "FAILED" })
      .select("workflowName tenantId startedAt nodeRuns")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean<
        {
          _id: Types.ObjectId;
          workflowName: string;
          tenantId: Types.ObjectId;
          startedAt: Date;
          nodeRuns: { error?: string }[];
        }[]
      >(),
  ]);

  const count = (rows: { _id: string; count: number }[], key: string): number =>
    rows.find((row) => row._id === key)?.count ?? 0;

  const tenantTotal = tenantRows.reduce((sum, row) => sum + row.count, 0);
  const userTotal = userRows.reduce((sum, row) => sum + row.count, 0);
  const execTotal = execRows.reduce((sum, row) => sum + row.count, 0);
  const success = count(execRows, "SUCCESS");
  const failed = count(execRows, "FAILED");
  const finished = success + failed;

  const byDate = new Map<
    string,
    { date: string; success: number; failed: number; running: number }
  >();

  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(Date.now() - i * DAY_MS).toISOString().slice(0, 10);
    byDate.set(date, { date, success: 0, failed: 0, running: 0 });
  }

  for (const row of dailyRows) {
    const bucket = byDate.get(row._id.date);
    if (!bucket) continue;
    if (row._id.status === "SUCCESS") bucket.success += row.count;
    else if (row._id.status === "FAILED") bucket.failed += row.count;
    else bucket.running += row.count;
  }

  const tenantIds = [
    ...topRows.map((row) => row._id),
    ...failures.map((row) => row.tenantId),
  ];
  const tenantDocs = await TenantModel.find({ _id: { $in: tenantIds } })
    .select("name")
    .lean<{ _id: Types.ObjectId; name: string }[]>();
  const tenantName = new Map(tenantDocs.map((t) => [t._id.toString(), t.name]));

  return {
    tenants: {
      total: tenantTotal,
      active: count(tenantRows, "ACTIVE"),
      disabled: count(tenantRows, "DISABLED"),
    },
    users: {
      total: userTotal,
      active: count(userRows, "ACTIVE"),
      disabled: count(userRows, "DISABLED"),
    },
    workflows: { total: workflowTotal, active: workflowActive },
    executions: {
      total: execTotal,
      pending: count(execRows, "PENDING"),
      running: count(execRows, "RUNNING"),
      success,
      failed,
      successRate: finished === 0 ? 0 : Math.round((success / finished) * 1000) / 10,
      avgDurationMs: Math.round(durationRows[0]?.avg ?? 0),
    },
    queue: {
      pending: count(queueRows, "PENDING"),
      processing: count(queueRows, "PROCESSING"),
    },
    last7Days: Array.from(byDate.values()),
    topTenants: topRows.map((row) => ({
      tenantId: row._id.toString(),
      name: tenantName.get(row._id.toString()) ?? "Deleted tenant",
      executions: row.count,
    })),
    recentFailures: failures.map((row) => ({
      _id: row._id.toString(),
      workflowName: row.workflowName,
      tenantName: tenantName.get(row.tenantId.toString()) ?? "Deleted tenant",
      startedAt: row.startedAt,
      error: row.nodeRuns.find((run) => run.error)?.error ?? "Unknown error",
    })),
  };
}

export interface PageFilters {
  search?: string | undefined;
  status?: string | undefined;
  page: number;
  limit: number;
}

export async function listAdminTenants(filters: PageFilters) {
  const { search, status, page, limit } = filters;
  const query: Record<string, unknown> = {};

  if (status === "ACTIVE" || status === "DISABLED") query.status = status;
  if (search) {
    const re = { $regex: escapeRegex(search), $options: "i" };
    query.$or = [{ name: re }, { slug: re }];
  }

  const [tenants, total] = await Promise.all([
    TenantModel.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<
        {
          _id: Types.ObjectId;
          name: string;
          slug: string;
          status: string;
          createdAt: Date;
        }[]
      >(),
    TenantModel.countDocuments(query),
  ]);

  const ids = tenants.map((t) => t._id);

  const [userCounts, workflowCounts, execCounts] = await Promise.all([
    UserModel.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { tenantId: { $in: ids } } },
      { $group: { _id: "$tenantId", count: { $sum: 1 } } },
    ]),
    WorkflowModel.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { tenantId: { $in: ids }, status: { $ne: "ARCHIVED" } } },
      { $group: { _id: "$tenantId", count: { $sum: 1 } } },
    ]),
    ExecutionModel.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { tenantId: { $in: ids } } },
      { $group: { _id: "$tenantId", count: { $sum: 1 } } },
    ]),
  ]);

  const toMap = (rows: { _id: Types.ObjectId; count: number }[]) =>
    new Map(rows.map((row) => [row._id.toString(), row.count]));
  const users = toMap(userCounts);
  const workflows = toMap(workflowCounts);
  const executions = toMap(execCounts);

  return {
    items: tenants.map((tenant) => ({
      ...tenant,
      userCount: users.get(tenant._id.toString()) ?? 0,
      workflowCount: workflows.get(tenant._id.toString()) ?? 0,
      executionCount: executions.get(tenant._id.toString()) ?? 0,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateTenantStatus(
  tenantId: string,
  status: "ACTIVE" | "DISABLED",
) {
  if (!mongoose.isValidObjectId(tenantId)) return null;

  return TenantModel.findByIdAndUpdate(
    tenantId,
    { $set: { status } },
    { new: true, runValidators: true },
  ).lean();
}

export async function listAdminExecutions(filters: PageFilters) {
  const { search, status, page, limit } = filters;
  const query: Record<string, unknown> = {};

  if (status) query.status = status;
  if (search) {
    query.workflowName = { $regex: escapeRegex(search), $options: "i" };
  }

  const [items, total] = await Promise.all([
    ExecutionModel.find(query)
      .select("-definition -logs")
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<
        {
          _id: Types.ObjectId;
          tenantId: Types.ObjectId;
          workflowName: string;
          status: ExecutionStatus;
          startedAt: Date;
          finishedAt?: Date;
          nodeRuns: { status: string; error?: string }[];
        }[]
      >(),
    ExecutionModel.countDocuments(query),
  ]);

  const tenantDocs = await TenantModel.find({
    _id: { $in: items.map((item) => item.tenantId) },
  })
    .select("name")
    .lean<{ _id: Types.ObjectId; name: string }[]>();
  const tenantName = new Map(tenantDocs.map((t) => [t._id.toString(), t.name]));

  return {
    items: items.map(({ nodeRuns, ...item }) => ({
      ...item,
      tenantName: tenantName.get(item.tenantId.toString()) ?? "Deleted tenant",
      nodeCount: nodeRuns.length,
      deadLetterCount: nodeRuns.filter((run) => run.status === "DEAD_LETTER").length,
      error: nodeRuns.find((run) => run.error)?.error,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
