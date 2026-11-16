
export const NODE_TYPES = [
  "START",
  "END",
  "API_REQUEST",
  "CONDITION",
  "DELAY",
] as const;

export type NodeType = (typeof NODE_TYPES)[number];

export interface NodePosition {
  x: number;
  y: number;
}

export interface StartNodeConfig {
  [key: string]: never;
}

export interface EndNodeConfig {
  [key: string]: never;
}

export interface ApiRequestNodeConfig {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  headers?: Record<string, string>;
  body?: string;
}

export interface ConditionNodeConfig {
  /** Format: "{{nodeName.path}}" OPERATOR "value", e.g. {{start.status}} == "200" */
  expression: string;
}

export interface DelayNodeConfig {
  /** Delay in milliseconds before continuing to the next node. */
  ms: number;
}

export type NodeConfig =
  | StartNodeConfig
  | EndNodeConfig
  | ApiRequestNodeConfig
  | ConditionNodeConfig
  | DelayNodeConfig;

export interface WorkflowNode {
  id: string;
  type: NodeType;
  name: string;
  position: NodePosition;
  config: NodeConfig;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: "yes" | "no";
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

/**
 * Accumulated outputs of every node that has already run in an execution,
 * keyed by node name. Used to resolve {{nodeName.path}} templates.
 */
export type ExecutionContext = Record<string, unknown>;
