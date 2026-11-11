
import type { WorkflowNode } from "../types.js";
import type { HandlerResult } from "./start.handler.js";

/**
 * The delay itself does not happen here — it would block the worker.
 * Instead, the executor reads this node's config.ms when scheduling the
 * *next* job's runAt. This handler just records that the delay occurred.
 */
export async function run(_node: WorkflowNode): Promise<HandlerResult> {
  return { output: { delayed: true } };
}
