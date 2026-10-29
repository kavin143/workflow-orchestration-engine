import { Schema, model, Types } from "mongoose";

export const WORKFLOW_STATUSES = [
  "DRAFT",
  "ACTIVE",
  "ARCHIVED",
] as const;

export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];

export interface Workflow {
  tenantId: Types.ObjectId;
  createdBy: Types.ObjectId;
  name: string;
  description: string;
  status: WorkflowStatus;
  createdAt: Date;
  updatedAt: Date;
}

const workflowSchema = new Schema<Workflow>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      required: true,
      immutable: true,
      index: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
      immutable: true,
    },

    name: {
      type: String,
      required: [true, "Workflow name is required"],
      trim: true,
      minlength: [3, "Workflow name must contain at least 3 characters"],
      maxlength: [100, "Workflow name cannot exceed 100 characters"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      default: "",
    },

    status: {
      type: String,
      enum: WORKFLOW_STATUSES,
      default: "DRAFT",
      required: true,
    },
  },
  {
    timestamps: true,
    strict: "throw",
  },
);

// Common query pattern: retrieve a tenant's workflows, newest first.
workflowSchema.index({ tenantId: 1, createdAt: -1 });

const WorkflowModel = model<Workflow>("Workflow", workflowSchema);

export default WorkflowModel;