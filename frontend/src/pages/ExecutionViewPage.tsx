import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Background, ReactFlow, type Edge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { apiRequest } from '../services/api/apiClient'
import { Alert, Icon, Loader, PageHeader, StatusBadge } from '../components/ui'
import FlowNode, { KIND_ICON, type FlowNodeType } from '../components/flow/FlowNode'
import { toFlowEdge, toFlowNode } from '../components/flow/flowHelpers'
import type { WorkflowDefinition } from '../types/workflow-definition'
import {
  formatDateTime,
  formatDuration,
  formatMs,
  getErrorMessage,
  type ApiResponse,
} from '../utils/format'

type NodeRun = {
  nodeId: string
  name: string
  type: string
  status: string
  attempt: number
  maxAttempts: number
  startedAt?: string
  finishedAt?: string
  output?: unknown
  error?: string
}

type ExecutionDetail = {
  _id: string
  workflowId: string
  workflowName: string
  status: string
  startedAt: string
  finishedAt?: string
  definition: WorkflowDefinition
  nodeRuns: NodeRun[]
  logs: { timestamp: string; message: string }[]
}

const nodeTypes = { flow: FlowNode }

const TYPE_LABEL: Record<string, string> = {
  START: 'Start',
  END: 'End',
  API_REQUEST: 'API request',
  CONDITION: 'Condition',
  DELAY: 'Delay',
}

function logClass(message: string): string {
  if (/dead letter|failed|stopped/i.test(message)) return 'bad'
  if (/completed|success/i.test(message)) return 'good'
  if (/retry/i.test(message)) return 'warn'
  return ''
}

function prettyJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export default function ExecutionViewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [execution, setExecution] = useState<ExecutionDetail | null>(null)
  const [error, setError] = useState('')
  const [rerunning, setRerunning] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [, setTick] = useState(0)

  const load = useCallback(async () => {
    if (!id) return

    try {
      const response = await apiRequest<ApiResponse<ExecutionDetail>>(`executions/${id}`)
      setExecution(response.data)
      setError('')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const active = execution?.status === 'PENDING' || execution?.status === 'RUNNING'

  useEffect(() => {
    if (!active) return

    const poll = setInterval(() => void load(), 1500)
    const clock = setInterval(() => setTick((n) => n + 1), 500)
    return () => {
      clearInterval(poll)
      clearInterval(clock)
    }
  }, [active, load])

  const runById = useMemo(
    () => new Map((execution?.nodeRuns ?? []).map((run) => [run.nodeId, run])),
    [execution],
  )

  const { nodes, edges } = useMemo(() => {
    if (!execution) return { nodes: [] as FlowNodeType[], edges: [] as Edge[] }

    const finished = execution.status === 'SUCCESS' || execution.status === 'FAILED'

    return {
      nodes: execution.definition.nodes.map((node) => {
        const status = runById.get(node.id)?.status
        return {
          ...toFlowNode(node, {
            status,
            skipped: finished && status === 'PENDING',
          }),
          selected: node.id === selectedId,
        }
      }),
      edges: execution.definition.edges.map((edge) => {
        const sourceStatus = runById.get(edge.source)?.status
        const targetStatus = runById.get(edge.target)?.status
        const live = sourceStatus === 'SUCCESS' && (targetStatus === 'RUNNING' || targetStatus === 'RETRYING')
        return toFlowEdge(edge, live)
      }),
    }
  }, [execution, runById, selectedId])

  async function handleRerun() {
    if (!id) return

    setRerunning(true)
    setError('')

    try {
      const response = await apiRequest<ApiResponse<{ executionId: string }>>(
        `executions/${id}/rerun`,
        { method: 'POST' },
      )
      setSelectedId(null)
      setExecution(null)
      navigate(`/executions/${response.data.executionId}`)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setRerunning(false)
    }
  }

  if (error && !execution) {
    return (
      <div className="page">
        <Alert kind="error">{error}</Alert>
        <Link to="/executions" className="btn">
          <Icon name="arrowLeft" size={15} /> Back to executions
        </Link>
      </div>
    )
  }

  if (!execution) {
    return (
      <div className="page">
        <Loader label="Loading execution…" />
      </div>
    )
  }

  const selectedRun = selectedId ? runById.get(selectedId) : undefined
  const doneCount = execution.nodeRuns.filter((run) => run.status === 'SUCCESS').length

  return (
    <div className="page">
      <PageHeader
        crumbs={
          <>
            <Link to="/executions">Executions</Link> / <span>#{execution._id.slice(-6)}</span>
          </>
        }
        title={execution.workflowName}
        subtitle={`Started ${formatDateTime(execution.startedAt)} · ${formatDuration(execution.startedAt, execution.finishedAt)}`}
        actions={
          <>
            {active && (
              <span className="live">
                <i /> Live
              </span>
            )}
            <StatusBadge status={execution.status} />
            <Link to={`/workflows/${execution.workflowId}/builder`} className="btn">
              <Icon name="workflow" size={15} /> Open builder
            </Link>
            <button type="button" className="btn primary" disabled={rerunning || active} onClick={() => void handleRerun()}>
              <Icon name="refresh" size={15} /> {rerunning ? 'Starting…' : 'Run again'}
            </button>
          </>
        }
      />

      {error && <Alert kind="error">{error}</Alert>}

      <section className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <h2>Workflow graph</h2>
          <small>
            {doneCount}/{execution.nodeRuns.length} steps complete · click a node for details
          </small>
        </div>
        <div className="flow-box">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable
            onNodeClick={(_event, node) => setSelectedId(node.id)}
            onPaneClick={() => setSelectedId(null)}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            minZoom={0.3}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={22} color="#dfe3ee" />
          </ReactFlow>
        </div>
      </section>

      <div className="exec-layout">
        <div>
          <section className="card">
            <div className="card-head">
              <h2>Execution logs</h2>
              <small>{execution.logs.length} events</small>
            </div>
            <div className="logs">
              {execution.logs.map((log, index) => (
                <div key={index} className={`log-line ${logClass(log.message)}`}>
                  <time>{new Date(log.timestamp).toLocaleTimeString('en-GB')}</time>
                  <span>{log.message}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div>
          <section className="card" style={{ marginBottom: 16 }}>
            <div className="card-head">
              <h2>Steps</h2>
            </div>
            <div className="steps">
              {execution.definition.nodes.map((node) => {
                const run = runById.get(node.id)
                const status = run?.status ?? 'PENDING'
                const finished = execution.status === 'SUCCESS' || execution.status === 'FAILED'
                const skipped = finished && status === 'PENDING'

                return (
                  <button
                    key={node.id}
                    type="button"
                    className={`step ${selectedId === node.id ? 'active' : ''}`}
                    onClick={() => setSelectedId(node.id)}
                    style={skipped ? { opacity: 0.5 } : undefined}
                  >
                    <div className={`ni k-${node.type}`} style={{ width: 30, height: 30 }}>
                      <Icon name={KIND_ICON[node.type]} size={15} />
                    </div>
                    <div className="grow" style={{ minWidth: 0, flex: 1 }}>
                      <div className="cell-title truncate" style={{ fontSize: 13 }}>{node.name}</div>
                      <div className="small muted">
                        {TYPE_LABEL[node.type]}
                        {run?.startedAt && run.finishedAt && ` · ${formatMs(new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime())}`}
                        {run && run.attempt > 1 && ` · attempt ${run.attempt}/${run.maxAttempts}`}
                      </div>
                    </div>
                    {skipped ? <span className="badge b-muted">Skipped</span> : <StatusBadge status={status} />}
                  </button>
                )
              })}
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <h2>{selectedRun ? selectedRun.name : 'Step details'}</h2>
              {selectedRun && <StatusBadge status={selectedRun.status} />}
            </div>
            <div className="card-body">
              {!selectedRun ? (
                <p className="muted small">Select a node in the graph or list to inspect its output.</p>
              ) : (
                <>
                  <div className="small muted" style={{ marginBottom: 10 }}>
                    {TYPE_LABEL[selectedRun.type]} · attempt {selectedRun.attempt}/{selectedRun.maxAttempts}
                  </div>
                  {selectedRun.error && <Alert kind="error">{selectedRun.error}</Alert>}
                  {selectedRun.output !== undefined ? (
                    <>
                      <div className="small muted" style={{ marginBottom: 6 }}>Output</div>
                      <pre className="json">{prettyJson(selectedRun.output)}</pre>
                    </>
                  ) : (
                    !selectedRun.error && <p className="muted small">No output yet.</p>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
