
import { getNextNodeIds } from "./graph.js";
import type {
  DelayNodeConfig,
  ExecutionContext,
  NodeType,
  WorkflowNode,
} from "./types.js";
import * as startHandler from "./handlers/start.handler.js";
import * as endHandler from "./handlers/end.handler.js";
import * as apiRequestHandler from "./handlers/api-request.handler.js";
import * as conditionHandler from "./handlers/condition.handler.js";
import * as delayHandler from "./handlers/delay.handler.js";
import type { HandlerResult } from "./handlers/start.handler.js";
import {
  appendLog,
  findExecutionById,
  finishExecution,
  updateNodeRun,
} from "../repositories/execution.repository.js";
import {
  createJob,
  markJobDone,
  markJobFailed,
  type ClaimedJob,
} from "../repositories/job.repository.js";

const MAX_ATTEMPTS = 3;
const RETRY_BACKOFF_MS = 2000;

const handlers: Record<
  NodeType,
  (node: WorkflowNode, context: ExecutionContext) => Promise<HandlerResult>
> = {
  START: startHandler.run,
  END: endHandler.run,
  API_REQUEST: apiRequestHandler.run,
  CONDITION: conditionHandler.run,
  DELAY: delayHandler.run,
};

/**
 * Processes a single queued job: runs the node it points to, then either
 * advances the execution to the next node(s), retries, or moves the node
 * to the dead-letter state and fails the execution.
 */
export async function processJob(job: ClaimedJob): Promise<void> {
  const execution = await findExecutionById(job.executionId.toString());

  if (!execution || execution.status === "FAILED" || execution.status === "SUCCESS") {
    await markJobDone(job._id.toString());
    return;
  }

  const node = execution.definition.nodes.find((n) => n.id === job.nodeId);

  if (!node) {
    await markJobDone(job._id.toString());
    return;
  }

  const attempt = job.attempts + 1;

  await updateNodeRun(execution._id.toString(), node.id, {
    status: "RUNNING",
    attempt,
    startedAt: new Date(),
  });
  await appendLog(execution._id.toString(), `Executing node: ${node.name}`);

  const context = buildContext(execution.nodeRuns, execution.definition.nodes);

  try {
    const result = await handlers[node.type](node, context);

    await updateNodeRun(execution._id.toString(), node.id, {
      status: "SUCCESS",
      finishedAt: new Date(),
      output: result.output,
    });
    await appendLog(execution._id.toString(), `${node.name} completed`);
    await markJobDone(job._id.toString());

    const nextNodeIds = getNextNodeIds(
      node,
      execution.definition.edges,
      result.branch,
    );

    if (nextNodeIds.length === 0) {
      if (node.type === "END") {
        await finishExecution(execution._id.toString(), "SUCCESS");
      } else {
        await finishExecution(execution._id.toString(), "FAILED");
        await appendLog(
          execution._id.toString(),
          `Workflow stopped: "${node.name}" has no outgoing path`,
        );
      }
      return;
    }

    const delayMs =
      node.type === "DELAY" ? (node.config as DelayNodeConfig).ms : 0;
    const runAt = new Date(Date.now() + delayMs);

    for (const nextNodeId of nextNodeIds) {
      await createJob(execution._id.toString(), nextNodeId, runAt);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (attempt < MAX_ATTEMPTS) {
      await updateNodeRun(execution._id.toString(), node.id, {
        status: "RETRYING",
        error: message,
      });
      await appendLog(
        execution._id.toString(),
        `${node.name} failed (attempt ${attempt}/${MAX_ATTEMPTS}): ${message}`,
      );
      await markJobFailed(
        job._id.toString(),
        new Date(Date.now() + attempt * RETRY_BACKOFF_MS),
      );
    } else {
      await updateNodeRun(execution._id.toString(), node.id, {
        status: "DEAD_LETTER",
        finishedAt: new Date(),
        error: message,
      });
      await appendLog(
        execution._id.toString(),
        `${node.name} moved to Dead Letter Queue after ${MAX_ATTEMPTS} failed attempts`,
      );
      await markJobDone(job._id.toString());
      await finishExecution(execution._id.toString(), "FAILED");
    }
  }
}

function buildContext(
  nodeRuns: {
    nodeId: string;
    status: string;
    output?: unknown;
  }[],
  nodes: WorkflowNode[],
): ExecutionContext {
  const context: ExecutionContext = {};
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  for (const nodeRun of nodeRuns) {
    if (nodeRun.status !== "SUCCESS") {
      continue;
    }

    const node = nodeById.get(nodeRun.nodeId);

    if (node) {
      context[node.name] = nodeRun.output;
    }
  }

  return context;
}
