import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { Icon, type IconName } from '../ui'
import type { NodeType } from '../../types/workflow-definition'

export type FlowNodeData = {
  label: string
  kind: NodeType
  subtitle?: string
  /** Execution status of this node; only set in the execution viewer. */
  status?: string
  skipped?: boolean
  [key: string]: unknown
}

export type FlowNodeType = Node<FlowNodeData, 'flow'>

export const KIND_ICON: Record<NodeType, IconName> = {
  START: 'play',
  END: 'flag',
  API_REQUEST: 'globe',
  CONDITION: 'branch',
  DELAY: 'timer',
}

function StatusIcon({ status }: { status?: string }) {
  if (!status || status === 'PENDING') return null
  if (status === 'SUCCESS') return <span style={{ color: '#059669' }}><Icon name="check" size={16} stroke={3} /></span>
  if (status === 'RUNNING') return <span className="spinner" style={{ width: 14, height: 14 }} />
  if (status === 'RETRYING') return <span style={{ color: '#d97706' }}><Icon name="refresh" size={15} stroke={2.6} /></span>
  return <span style={{ color: '#dc2626' }}><Icon name="alert" size={16} stroke={2.6} /></span>
}

export default function FlowNode({ data, selected }: NodeProps<FlowNodeType>) {
  const isStart = data.kind === 'START'
  const isEnd = data.kind === 'END'
  const isCondition = data.kind === 'CONDITION'

  const classes = [
    'fnode',
    selected ? 'selected' : '',
    data.status ? `s-${data.status}` : '',
    data.skipped ? 'skipped' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}>
      {!isStart && <Handle type="target" position={Position.Left} className="h" />}

      <div className={`ni k-${data.kind}`}>
        <Icon name={KIND_ICON[data.kind]} size={17} />
      </div>
      <div className="t">
        <strong title={data.label}>{data.label}</strong>
        <span>{data.subtitle}</span>
      </div>
      <div className="st">
        <StatusIcon status={data.status} />
      </div>

      {isCondition ? (
        <>
          <Handle id="yes" type="source" position={Position.Right} className="h h-yes" style={{ top: '30%' }} />
          <Handle id="no" type="source" position={Position.Right} className="h h-no" style={{ top: '70%' }} />
          <span className="h-label yes" style={{ top: '14%' }}>yes</span>
          <span className="h-label no" style={{ top: 'auto', bottom: '14%' }}>no</span>
        </>
      ) : (
        !isEnd && <Handle type="source" position={Position.Right} className="h" />
      )}
    </div>
  )
}
