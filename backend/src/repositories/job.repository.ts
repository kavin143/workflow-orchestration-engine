
import { Types } from "mongoose";
import JobModel, { type Job } from "../models/job.model.js";

export type ClaimedJob = Job & { _id: Types.ObjectId };

export async function createJob(
  executionId: string,
  nodeId: string,
  runAt: Date = new Date(),
): Promise<void> {
  await JobModel.create({
    executionId: new Types.ObjectId(executionId),
    nodeId,
    runAt,
  });
}

/**
 * Atomically claims the next due job so that a single worker process
 * never processes the same job twice.
 */
export async function claimNextJob(): Promise<ClaimedJob | null> {
  return JobModel.findOneAndUpdate(
    { status: "PENDING", runAt: { $lte: new Date() } },
    { $set: { status: "PROCESSING" } },
    { sort: { runAt: 1 }, returnDocument: "after" },
  )
    .lean<ClaimedJob>()
    .exec();
}

export async function markJobDone(jobId: string): Promise<void> {
  await JobModel.findByIdAndDelete(jobId).exec();
}

/**
 * Returns a failed job to the queue for a retry, incrementing its
 * attempt counter and scheduling it for a later run.
 */
export async function markJobFailed(
  jobId: string,
  nextRunAt: Date,
): Promise<void> {
  await JobModel.findByIdAndUpdate(jobId, {
    $set: { status: "PENDING", runAt: nextRunAt },
    $inc: { attempts: 1 },
  }).exec();
}
