
import type { WorkflowNode } from "../types.js";
import type { HandlerResult } from "./start.handler.js";

export async function run(_node: WorkflowNode): Promise<HandlerResult> {
  return { output: { finishedAt: new Date().toISOString() } };
}
