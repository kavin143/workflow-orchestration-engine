import { MarkerType, type Edge } from '@xyflow/react'
import type { FlowNodeType } from './FlowNode'
import {
  NODE_TYPE_LABELS,
  type BackendEdge,
  type BackendNode,
  type NodeConfig,
} from '../../types/workflow-definition'

export function nodeSubtitle(type: BackendNode['type'], config: NodeConfig): string {
  switch (type) {
    case 'API_REQUEST': {
      const c = config as { method?: string; url?: string }
      let host = c.url ?? ''
      try {
        host = new URL(host.replace(/\{\{.*?\}\}/g, '0')).host
      } catch {
        // keep the raw value
      }
      return `${c.method ?? 'GET'} · ${host || 'no URL'}`
    }
    case 'CONDITION':
      return (config as { expression?: string }).expression || 'no expression'
    case 'DELAY':
      return `Wait ${(config as { ms?: number }).ms ?? 0} ms`
    default:
      return NODE_TYPE_LABELS[type]
  }
}

export function toFlowNode(node: BackendNode, extra: Partial<FlowNodeType['data']> = {}): FlowNodeType {
  return {
    id: node.id,
    type: 'flow',
    position: node.position,
    data: {
      label: node.name,
      kind: node.type,
      subtitle: nodeSubtitle(node.type, node.config),
      ...extra,
    },
  }
}

export function edgeColor(handle?: string | null): string {
  if (handle === 'yes') return '#10b981'
  if (handle === 'no') return '#ef4444'
  return '#94a3b8'
}

export function toFlowEdge(edge: BackendEdge, animated = false): Edge {
  const color = edgeColor(edge.sourceHandle)

  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle ?? null,
    type: 'smoothstep',
    animated,
    label: edge.sourceHandle,
    labelStyle: { fill: color, fontWeight: 700, fontSize: 11, textTransform: 'uppercase' },
    labelBgStyle: { fill: '#fff' },
    style: { stroke: color, strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color },
  }
}
