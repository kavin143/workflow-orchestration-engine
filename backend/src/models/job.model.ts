
import { Schema, model, Types } from "mongoose";

export const JOB_STATUSES = ["PENDING", "PROCESSING", "DONE"] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

/**
 * A single queued unit of work: "run this node of this execution".
 * This is a minimal Mongo-backed queue — no external broker — which is
 * enough for a single local worker process.
 */
export interface Job {
  executionId: Types.ObjectId;
  nodeId: string;
  status: JobStatus;
  attempts: number;
  runAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<Job>(
  {
    executionId: {
      type: Schema.Types.ObjectId,
      required: true,
      immutable: true,
      index: true,
    },

    nodeId: {
      type: String,
      required: true,
      immutable: true,
    },

    status: {
      type: String,
      enum: JOB_STATUSES,
      default: "PENDING",
      required: true,
    },

    attempts: {
      type: Number,
      default: 0,
    },

    runAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    strict: "throw",
  },
);

jobSchema.index({ status: 1, runAt: 1 });

const JobModel = model<Job>("Job", jobSchema);

export default JobModel;
