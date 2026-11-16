
import type { WorkflowNode } from "../types.js";

export interface HandlerResult {
  output?: unknown;
  branch?: "yes" | "no";
}

export async function run(_node: WorkflowNode): Promise<HandlerResult> {
  return { output: { startedAt: new Date().toISOString() } };
}
