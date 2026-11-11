
import { claimNextJob } from "../repositories/job.repository.js";
import { processJob } from "../engine/executor.js";

const POLL_INTERVAL_MS = 1000;

let polling = false;

async function pollOnce(): Promise<void> {
  if (polling) {
    return;
  }

  polling = true;

  try {
    for (;;) {
      const job = await claimNextJob();

      if (!job) {
        break;
      }

      try {
        await processJob(job);
      } catch (error: unknown) {
        console.error("Execution worker failed to process a job:", error);
      }
    }
  } finally {
    polling = false;
  }
}

/**
 * Starts the in-process execution worker. It repeatedly claims and runs
 * due jobs from the Mongo-backed queue. Call once during server startup.
 */
export function startExecutionWorker(): void {
  setInterval(() => {
    void pollOnce();
  }, POLL_INTERVAL_MS);
}
