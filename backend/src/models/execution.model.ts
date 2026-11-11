
import { Schema, model, Types } from "mongoose";
import type { WorkflowDefinition } from "../engine/types.js";

export const EXECUTION_STATUSES = [
  "PENDING",
  "RUNNING",
  "SUCCESS",
  "FAILED",
] as const;

export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number];

export const NODE_RUN_STATUSES = [
  "PENDING",
  "RUNNING",
  "SUCCESS",
  "FAILED",
  "RETRYING",
  "DEAD_LETTER",
] as const;

export type NodeRunStatus = (typeof NODE_RUN_STATUSES)[number];

export interface NodeRun {
  nodeId: string;
  name: string;
  type: string;
  status: NodeRunStatus;
  attempt: number;
  maxAttempts: number;
  startedAt?: Date;
  finishedAt?: Date;
  output?: unknown;
  error?: string;
}

export interface ExecutionLogEntry {
  timestamp: Date;
  message: string;
}

export interface Execution {
  tenantId: Types.ObjectId;
  workflowId: Types.ObjectId;
  workflowName: string;
  triggeredBy: Types.ObjectId;
  definition: WorkflowDefinition;
  status: ExecutionStatus;
  startedAt: Date;
  finishedAt?: Date;
  nodeRuns: NodeRun[];
  logs: ExecutionLogEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const nodeRunSchema = new Schema<NodeRun>(
  {
    nodeId: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    status: {
      type: String,
      enum: NODE_RUN_STATUSES,
      default: "PENDING",
      required: true,
    },
    attempt: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    startedAt: { type: Date },
    finishedAt: { type: Date },
    output: { type: Schema.Types.Mixed },
    error: { type: String },
  },
  { _id: false },
);

const logEntrySchema = new Schema<ExecutionLogEntry>(
  {
    timestamp: { type: Date, required: true, default: Date.now },
    message: { type: String, required: true },
  },
  { _id: false },
);

const executionSchema = new Schema<Execution>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      required: true,
      immutable: true,
      index: true,
    },

    workflowId: {
      type: Schema.Types.ObjectId,
      required: true,
      immutable: true,
      index: true,
    },

    workflowName: {
      type: String,
      required: true,
    },

    triggeredBy: {
      type: Schema.Types.ObjectId,
      required: true,
      immutable: true,
    },

    // Snapshot of the workflow's graph at run time, so later edits to the
    // live workflow never affect an execution already in progress.
    definition: {
      type: Schema.Types.Mixed,
      required: true,
      immutable: true,
    },

    status: {
      type: String,
      enum: EXECUTION_STATUSES,
      default: "PENDING",
      required: true,
    },

    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    finishedAt: {
      type: Date,
    },

    nodeRuns: {
      type: [nodeRunSchema],
      default: [],
    },

    logs: {
      type: [logEntrySchema],
      default: [],
    },
  },
  {
    timestamps: true,
    strict: "throw",
  },
);

executionSchema.index({ tenantId: 1, createdAt: -1 });
executionSchema.index({ tenantId: 1, workflowId: 1, createdAt: -1 });

const ExecutionModel = model<Execution>("Execution", executionSchema);

export default ExecutionModel;
