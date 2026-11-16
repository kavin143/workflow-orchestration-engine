export type NodeType = 'START' | 'END' | 'API_REQUEST' | 'CONDITION' | 'DELAY'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type NodeConfig =
  | Record<string, never>
  | { method: HttpMethod; url: string; headers?: Record<string, string>; body?: string }
  | { expression: string }
  | { ms: number }

export type BackendNode = {
  id: string
  type: NodeType
  name: string
  position: { x: number; y: number }
  config: NodeConfig
}

export type BackendEdge = {
  id: string
  source: string
  target: string
  sourceHandle?: 'yes' | 'no'
}

export type WorkflowDefinition = {
  nodes: BackendNode[]
  edges: BackendEdge[]
}

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  START: 'Start',
  END: 'End',
  API_REQUEST: 'API Request',
  CONDITION: 'Condition',
  DELAY: 'Delay',
}

export function defaultConfigFor(type: NodeType): NodeConfig {
  switch (type) {
    case 'API_REQUEST':
      return { method: 'GET', url: '' }
    case 'CONDITION':
      return { expression: '' }
    case 'DELAY':
      return { ms: 1000 }
    default:
      return {}
  }
}
