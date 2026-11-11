
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { apiRequest } from '../services/api/apiClient'
import {
  NODE_TYPE_LABELS,
  defaultConfigFor,
  type BackendEdge,
  type BackendNode,
  type NodeConfig,
  type NodeType,
  type WorkflowDefinition,
} from '../types/workflow-definition'

type ApiResponse<T> = { success: boolean; data: T }

type WorkflowDetail = {
  _id: string
  name: string
  definition: WorkflowDefinition
}

type ValidationResult = { valid: boolean; errors: string[] }

const NODE_TYPES: NodeType[] = ['START', 'END', 'API_REQUEST', 'CONDITION', 'DELAY']

const NODE_COLORS: Record<NodeType, { background: string; border: string }> = {
  START: { background: '#e9f7ef', border: '#198754' },
  END: { background: '#e9ecef', border: '#495057' },
  API_REQUEST: { background: '#e7f1ff', border: '#0d6efd' },
  CONDITION: { background: '#fff3cd', border: '#fd7e14' },
  DELAY: { background: '#ede7f6', border: '#6f42c1' },
}

function styleFor(type: NodeType) {
  const colors = NODE_COLORS[type]
  return {
    background: colors.background,
    border: `2px solid ${colors.border}`,
    borderRadius: 8,
    padding: 8,
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: 'pre-line' as const,
  }
}

let nextIdCounter = 1

function generateId(): string {
  nextIdCounter += 1
  return `node-${Date.now()}-${nextIdCounter}`
}

function toFlowNodes(nodes: BackendNode[]): Node[] {
  return nodes.map((node) => ({
    id: node.id,
    position: node.position,
    data: { label: `${node.name}\n(${NODE_TYPE_LABELS[node.type]})` },
    style: styleFor(node.type),
  }))
}

function toFlowEdges(edges: BackendEdge[]): Edge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.sourceHandle,
    data: { sourceHandle: edge.sourceHandle },
  }))
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.'
}

export default function WorkflowBuilderPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [workflowName, setWorkflowName] = useState('')
  const [nodeMeta, setNodeMeta] = useState<Record<string, { type: NodeType; name: string; config: NodeConfig }>>({})
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [validation, setValidation] = useState<ValidationResult | null>(null)

  useEffect(() => {
    if (!id) return

    async function load() {
      setLoading(true)
      setError('')

      try {
        const response = await apiRequest<ApiResponse<WorkflowDetail>>(`workflows/${id}`)
        const definition = response.data.definition ?? { nodes: [], edges: [] }

        setWorkflowName(response.data.name)
        setNodes(toFlowNodes(definition.nodes))
        setEdges(toFlowEdges(definition.edges))

        const meta: Record<string, { type: NodeType; name: string; config: NodeConfig }> = {}
        for (const node of definition.nodes) {
          meta[node.id] = { type: node.type, name: node.name, config: node.config }
        }
        setNodeMeta(meta)
      } catch (err) {
        setError(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [id, setNodes, setEdges])

  const onConnect = useCallback(
    (connection: Connection) => {
      const edgeId = `edge-${connection.source}-${connection.target}-${Date.now()}`
      setEdges((current) => addEdge({ ...connection, id: edgeId }, current))
    },
    [setEdges],
  )

  function addNode(type: NodeType) {
    const id = generateId()
    const name = `${NODE_TYPE_LABELS[type]} ${Object.keys(nodeMeta).length + 1}`
    const config = defaultConfigFor(type)

    setNodeMeta((current) => ({ ...current, [id]: { type, name, config } }))
    setNodes((current) => {
      const index = current.length
      const column = index % 5
      const row = Math.floor(index / 5)

      return [
        ...current,
        {
          id,
          position: { x: 60 + column * 220, y: 60 + row * 160 },
          data: { label: `${name}\n(${NODE_TYPE_LABELS[type]})` },
          style: styleFor(type),
        },
      ]
    })
  }

  function updateSelectedNodeMeta(changes: Partial<{ name: string; config: NodeConfig }>) {
    if (!selectedNodeId) return

    setNodeMeta((current) => {
      const existing = current[selectedNodeId]
      if (!existing) return current

      const updated = { ...existing, ...changes }
      setNodes((currentNodes) =>
        currentNodes.map((node) =>
          node.id === selectedNodeId
            ? { ...node, data: { label: `${updated.name}\n(${NODE_TYPE_LABELS[updated.type]})` } }
            : node,
        ),
      )

      return { ...current, [selectedNodeId]: updated }
    })
  }

  function updateSelectedEdgeBranch(branch: 'yes' | 'no' | '') {
    if (!selectedEdgeId) return

    setEdges((current) =>
      current.map((edge) =>
        edge.id === selectedEdgeId
          ? {
              ...edge,
              label: branch || undefined,
              data: { sourceHandle: branch || undefined },
            }
          : edge,
      ),
    )
  }

  function deleteSelectedNode() {
    if (!selectedNodeId) return

    setNodes((current) => current.filter((node) => node.id !== selectedNodeId))
    setEdges((current) =>
      current.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId),
    )
    setNodeMeta((current) => {
      const rest = { ...current }
      delete rest[selectedNodeId]
      return rest
    })
    setSelectedNodeId(null)
  }

  function buildDefinition(): WorkflowDefinition {
    return {
      nodes: nodes.map((node) => {
        const meta = nodeMeta[node.id]
        return {
          id: node.id,
          type: meta?.type ?? 'START',
          name: meta?.name ?? node.id,
          position: node.position,
          config: meta?.config ?? {},
        }
      }),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        ...((edge.data as { sourceHandle?: 'yes' | 'no' } | undefined)?.sourceHandle
          ? { sourceHandle: (edge.data as { sourceHandle?: 'yes' | 'no' }).sourceHandle }
          : {}),
      })),
    }
  }

  async function handleValidate() {
    setError('')
    setNotice('')
    setValidation(null)

    try {
      const response = await apiRequest<ApiResponse<ValidationResult>>(
        `workflows/${id}/validate`,
        { method: 'POST', body: JSON.stringify(buildDefinition()) },
      )
      setValidation(response.data)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setNotice('')

    try {
      await apiRequest(`workflows/${id}/definition`, {
        method: 'PUT',
        body: JSON.stringify(buildDefinition()),
      })
      setNotice('Workflow graph saved.')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleRun() {
    setRunning(true)
    setError('')
    setNotice('')

    try {
      await apiRequest(`workflows/${id}/definition`, {
        method: 'PUT',
        body: JSON.stringify(buildDefinition()),
      })

      const response = await apiRequest<ApiResponse<{ executionId: string }>>(
        `workflows/${id}/run`,
        { method: 'POST' },
      )
      navigate(`/executions/${response.data.executionId}`)
    } catch (err) {
      setError(getErrorMessage(err))
      setRunning(false)
    }
  }

  const selectedMeta = selectedNodeId ? nodeMeta[selectedNodeId] : null
  const selectedEdge = selectedEdgeId ? edges.find((edge) => edge.id === selectedEdgeId) : null
  const selectedEdgeSourceType = selectedEdge ? nodeMeta[selectedEdge.source]?.type : null

  if (loading) {
    return <div className="container-fluid py-3">Loading workflow…</div>
  }

  return (
    <div className="container-fluid py-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h1>Builder — {workflowName}</h1>
        <Link to="/workflows">Back to workflows</Link>
      </div>

        <div className="d-flex flex-wrap gap-2 mb-2">
          {NODE_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => addNode(type)}
            >
              + {NODE_TYPE_LABELS[type]}
            </button>
          ))}

          <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => void handleValidate()}>
            Validate
          </button>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            disabled={saving}
            onClick={() => void handleSave()}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            className="btn btn-sm btn-success"
            disabled={running}
            onClick={() => void handleRun()}
          >
            {running ? 'Starting…' : 'Run'}
          </button>
        </div>

        {notice && <div className="alert alert-success py-2">{notice}</div>}
        {error && <div className="alert alert-danger py-2">{error}</div>}

        {validation && (
          <div className={`alert py-2 ${validation.valid ? 'alert-success' : 'alert-warning'}`}>
            {validation.valid ? (
              'Graph is valid.'
            ) : (
              <ul className="mb-0">
                {validation.errors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="d-flex gap-3">
          <div style={{ width: 700, height: 500, border: '1px solid #dee2e6' }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={(_event, node) => {
                setSelectedNodeId(node.id)
                setSelectedEdgeId(null)
              }}
              onEdgeClick={(_event, edge) => {
                setSelectedEdgeId(edge.id)
                setSelectedNodeId(null)
              }}
              fitView
            >
              <Background />
              <Controls />
            </ReactFlow>
          </div>

          <div style={{ width: 300 }}>
            {selectedMeta && (
              <div className="border rounded p-2">
                <h2 className="h6">Node — {NODE_TYPE_LABELS[selectedMeta.type]}</h2>

                <label className="form-label">Name</label>
                <input
                  className="form-control mb-2"
                  value={selectedMeta.name}
                  onChange={(event) => updateSelectedNodeMeta({ name: event.target.value })}
                />

                {selectedMeta.type === 'API_REQUEST' && (
                  <>
                    <label className="form-label">Method</label>
                    <select
                      className="form-select mb-2"
                      value={(selectedMeta.config as { method: string }).method}
                      onChange={(event) =>
                        updateSelectedNodeMeta({
                          config: { ...(selectedMeta.config as object), method: event.target.value } as NodeConfig,
                        })
                      }
                    >
                      {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((method) => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </select>

                    <label className="form-label">URL</label>
                    <input
                      className="form-control mb-2"
                      placeholder="https://api.example.com/customers"
                      value={(selectedMeta.config as { url: string }).url}
                      onChange={(event) =>
                        updateSelectedNodeMeta({
                          config: { ...(selectedMeta.config as object), url: event.target.value } as NodeConfig,
                        })
                      }
                    />

                    <label className="form-label">Body (JSON, supports {'{{nodeName.path}}'})</label>
                    <textarea
                      className="form-control mb-2"
                      rows={4}
                      value={(selectedMeta.config as { body?: string }).body ?? ''}
                      onChange={(event) =>
                        updateSelectedNodeMeta({
                          config: { ...(selectedMeta.config as object), body: event.target.value } as NodeConfig,
                        })
                      }
                    />
                  </>
                )}

                {selectedMeta.type === 'CONDITION' && (
                  <>
                    <label className="form-label">Expression</label>
                    <input
                      className="form-control mb-2"
                      placeholder='{{start.status}} == "200"'
                      value={(selectedMeta.config as { expression: string }).expression}
                      onChange={(event) =>
                        updateSelectedNodeMeta({ config: { expression: event.target.value } })
                      }
                    />
                    <p className="text-muted small">
                      Connect outgoing edges and mark one "yes" and one "no" in the Edge panel.
                    </p>
                  </>
                )}

                {selectedMeta.type === 'DELAY' && (
                  <>
                    <label className="form-label">Delay (ms)</label>
                    <input
                      type="number"
                      className="form-control mb-2"
                      value={(selectedMeta.config as { ms: number }).ms}
                      onChange={(event) =>
                        updateSelectedNodeMeta({ config: { ms: Number(event.target.value) } })
                      }
                    />
                  </>
                )}

                <button type="button" className="btn btn-sm btn-outline-danger mt-2" onClick={deleteSelectedNode}>
                  Delete node
                </button>
              </div>
            )}

            {selectedEdge && (
              <div className="border rounded p-2">
                <h2 className="h6">Edge</h2>
                <p className="mb-1">From: {nodeMeta[selectedEdge.source]?.name ?? selectedEdge.source}</p>
                <p>To: {nodeMeta[selectedEdge.target]?.name ?? selectedEdge.target}</p>

                {selectedEdgeSourceType === 'CONDITION' && (
                  <>
                    <label className="form-label">Branch</label>
                    <select
                      className="form-select"
                      value={(selectedEdge.data as { sourceHandle?: string } | undefined)?.sourceHandle ?? ''}
                      onChange={(event) =>
                        updateSelectedEdgeBranch(event.target.value as 'yes' | 'no' | '')
                      }
                    >
                      <option value="">Select…</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </>
                )}
              </div>
            )}

            {!selectedMeta && !selectedEdge && (
              <p className="text-muted">Click a node or edge to edit it.</p>
            )}
          </div>
        </div>
    </div>
  )
}
