
import type { WorkflowDefinition, WorkflowEdge, WorkflowNode } from "./types.js";

export interface GraphValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates that a workflow definition is a well-formed, runnable graph:
 * exactly one START node, at least one END node, every node reachable
 * from START, no cycles, every edge references a real node, and every
 * CONDITION node has both a "yes" and a "no" outgoing edge.
 */
export function validateGraph(
  definition: WorkflowDefinition,
): GraphValidationResult {
  const errors: string[] = [];
  const { nodes, edges } = definition;

  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  const startNodes = nodes.filter((node) => node.type === "START");
  const endNodes = nodes.filter((node) => node.type === "END");

  if (startNodes.length !== 1) {
    errors.push(
      `A workflow must have exactly one Start node (found ${startNodes.length})`,
    );
  }

  if (endNodes.length < 1) {
    errors.push("A workflow must have at least one End node");
  }

  for (const edge of edges) {
    if (!nodeById.has(edge.source)) {
      errors.push(`Edge "${edge.id}" references an unknown source node`);
    }

    if (!nodeById.has(edge.target)) {
      errors.push(`Edge "${edge.id}" references an unknown target node`);
    }
  }

  for (const node of nodes) {
    if (node.type !== "CONDITION") {
      continue;
    }

    const outgoing = edges.filter((edge) => edge.source === node.id);
    const hasYes = outgoing.some((edge) => edge.sourceHandle === "yes");
    const hasNo = outgoing.some((edge) => edge.sourceHandle === "no");

    if (!hasYes || !hasNo) {
      errors.push(
        `Condition node "${node.name}" must have both a "yes" and a "no" outgoing edge`,
      );
    }
  }

  if (startNodes.length === 1 && errors.length === 0) {
    const reachable = findReachableNodeIds(startNodes[0]!.id, edges);

    for (const node of nodes) {
      if (!reachable.has(node.id)) {
        errors.push(`Node "${node.name}" is not reachable from Start`);
      }
    }

    if (hasCycle(nodes, edges)) {
      errors.push("The workflow graph contains a cycle");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function findReachableNodeIds(
  startId: string,
  edges: WorkflowEdge[],
): Set<string> {
  const visited = new Set<string>([startId]);
  const queue = [startId];

  while (queue.length > 0) {
    const current = queue.shift()!;

    for (const edge of edges) {
      if (edge.source === current && !visited.has(edge.target)) {
        visited.add(edge.target);
        queue.push(edge.target);
      }
    }
  }

  return visited;
}

function hasCycle(nodes: WorkflowNode[], edges: WorkflowEdge[]): boolean {
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map<string, number>(nodes.map((node) => [node.id, WHITE]));

  function visit(nodeId: string): boolean {
    color.set(nodeId, GRAY);

    for (const edge of edges) {
      if (edge.source !== nodeId) {
        continue;
      }

      const targetColor = color.get(edge.target);

      if (targetColor === GRAY) {
        return true;
      }

      if (targetColor === WHITE && visit(edge.target)) {
        return true;
      }
    }

    color.set(nodeId, BLACK);
    return false;
  }

  for (const node of nodes) {
    if (color.get(node.id) === WHITE && visit(node.id)) {
      return true;
    }
  }

  return false;
}

/**
 * Returns the id(s) of the node(s) that should run next after `node`
 * finishes, given its outgoing edges and (for CONDITION nodes) which
 * branch was taken.
 */
export function getNextNodeIds(
  node: WorkflowNode,
  edges: WorkflowEdge[],
  branch?: "yes" | "no",
): string[] {
  return edges
    .filter((edge) => {
      if (edge.source !== node.id) {
        return false;
      }

      if (node.type === "CONDITION") {
        return edge.sourceHandle === branch;
      }

      return true;
    })
    .map((edge) => edge.target);
}
