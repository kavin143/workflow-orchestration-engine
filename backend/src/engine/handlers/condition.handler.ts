
import type { ConditionNodeConfig, ExecutionContext, WorkflowNode } from "../types.js";
import { evaluateCondition } from "../condition.js";
import type { HandlerResult } from "./start.handler.js";

export async function run(
  node: WorkflowNode,
  context: ExecutionContext,
): Promise<HandlerResult> {
  const config = node.config as ConditionNodeConfig;
  const result = evaluateCondition(config.expression, context);

  return {
    output: { result },
    branch: result ? "yes" : "no",
  };
}
