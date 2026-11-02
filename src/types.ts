export type ScreenId =
  | 'login'
  | 'dashboard'
  | 'workflows'
  | 'create-workflow'
  | 'builder'
  | 'execution-live'
  | 'execution-history'
  | 'failure-dlq'
  | 'monitoring'
  | 'tenants'
  | 'api-keys'
  | 'settings';

export type NodeType =
  | 'start'
  | 'end'
  | 'api'
  | 'condition'
  | 'transform'
  | 'webhook'
  | 'delay'
  | 'script';

export interface WorkflowNode {
  id: string;
  type: NodeType;
  name: string;
  x: number;
  y: number;
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'retrying';
  duration?: string;
  retryCount?: number;
  maxRetries?: number;
  config: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url?: string;
    body?: string;
    conditionExpression?: string;
    delaySeconds?: number;
    scriptContent?: string;
    compensationUrl?: string;
    timeoutMs?: number;
    headers?: Record<string, string>;
  };
}

export interface WorkflowEdge {
  id: string;
  from: string;
  to: string;
  label?: string; // 'Yes', 'No', 'Retry 1', etc.
  type?: 'default' | 'conditional-true' | 'conditional-false' | 'retry' | 'dlq' | 'compensation';
}

export interface Workflow {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'draft';
  updatedAt: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  tags?: string[];
}

export interface ExecutionLog {
  id: string;
  time: string;
  nodeId?: string;
  nodeName?: string;
  message: string;
  level: 'info' | 'success' | 'warn' | 'error' | 'dlq';
}

export interface ExecutionRecord {
  id: string;
  workflowId: string;
  workflowName: string;
  tenantId: string;
  status: 'Success' | 'Failed' | 'Running' | 'Retrying' | 'Compensating';
  startedAt: string;
  duration: string;
  currentStep?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  logs: ExecutionLog[];
  retryDetails?: {
    attempt: number;
    maxRetries: number;
    lastError: string;
    dlqTopic?: string;
    compensationCompleted?: boolean;
  };
}

export interface Tenant {
  id: string;
  name: string;
  user: string;
  email: string;
  plan: 'Starter' | 'Pro' | 'Enterprise';
  executionsUsed: number;
  executionsLimit: number;
  concurrencyUsed: number;
  concurrencyLimit: number;
  status: 'Active' | 'Warning' | 'Restricted';
}

export interface WorkerInfo {
  id: string;
  name: string;
  status: 'Running' | 'Idle' | 'Degraded';
  cpu: number;
  memory: string;
  activeJobs: number;
  processedCount: number;
}
