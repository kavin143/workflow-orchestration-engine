import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type NodeChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { apiRequest } from '../services/api/apiClient'
import { Alert, Icon, Loader } from '../components/ui'
import FlowNode, { KIND_ICON, type FlowNodeType } from '../components/flow/FlowNode'
import { nodeSubtitle, toFlowEdge, toFlowNode } from '../components/flow/flowHelpers'
import {
  NODE_TYPE_LABELS,
  defaultConfigFor,
  type BackendNode,
  type HttpMethod,
  type NodeConfig,
  type NodeType,
  type WorkflowDefinition,
} from '../types/workflow-definition'
import { getErrorMessage, type ApiResponse } from '../utils/format'

type WorkflowDetail = { _id: string; name: string; status: string; definition: WorkflowDefinition }
type ValidationResult = { valid: boolean; errors: string[] }
type Meta = { type: NodeType; name: string; config: NodeConfig }

const nodeTypes = { flow: FlowNode }

const PALETTE: { type: NodeType; hint: string }[] = [
  { type: 'START', hint: 'Entry point' },
  { type: 'API_REQUEST', hint: 'Call any HTTP API' },
  { type: 'CONDITION', hint: 'Branch yes / no' },
  { type: 'DELAY', hint: 'Wait before next step' },
  { type: 'END', hint: 'Finish the run' },
]

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/

const NAME_PREFIX: Record<NodeType, string> = {
  START: 'start',
  END: 'end',
  API_REQUEST: 'apiRequest',
  CONDITION: 'condition',
  DELAY: 'delay',
}

let idCounter = 0
function newId(): string {
  idCounter += 1
  return `n${Date.now().toString(36)}${idCounter}`
}

function Builder() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { screenToFlowPosition, fitView } = useReactFlow()

  const [workflowName, setWorkflowName] = useState('')
  const [meta, setMeta] = useState<Record<string, Meta>>({})
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNodeType>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [copied, setCopied] = useState('')

  const wrapper = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return

    async function load() {
      try {
        const response = await apiRequest<ApiResponse<WorkflowDetail>>(`workflows/${id}`)
        const definition = response.data.definition ?? { nodes: [], edges: [] }

        setWorkflowName(response.data.name)
        setNodes(definition.nodes.map((node) => toFlowNode(node)))
        setEdges(definition.edges.map((edge) => toFlowEdge(edge)))
        setMeta(
          Object.fromEntries(
            definition.nodes.map((node) => [node.id, { type: node.type, name: node.name, config: node.config }]),
          ),
        )
      } catch (err) {
        setError(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [id, setNodes, setEdges])

  useEffect(() => {
    if (!loading) setTimeout(() => void fitView({ padding: 0.2 }), 60)
  }, [loading, fitView])

  const handleNodesChange = useCallback(
    (changes: NodeChange<FlowNodeType>[]) => {
      onNodesChange(changes)
      if (changes.some((change) => change.type === 'position' || change.type === 'remove')) {
        setDirty(true)
        setValidation(null)
      }
    },
    [onNodesChange],
  )

  const handleEdgesChange = useCallback(
    (changes: Parameters<typeof onEdgesChange>[0]) => {
      onEdgesChange(changes)
      if (changes.some((change) => change.type === 'remove')) {
        setDirty(true)
        setValidation(null)
      }
    },
    [onEdgesChange],
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      const handle = connection.sourceHandle === 'yes' || connection.sourceHandle === 'no' ? connection.sourceHandle : undefined

      setEdges((current) => {
        // One edge per condition branch, and no exact duplicates.
        const clean = current.filter(
          (edge) =>
            !(edge.source === connection.source && edge.target === connection.target && (edge.sourceHandle ?? null) === (handle ?? null)) &&
            !(handle && edge.source === connection.source && edge.sourceHandle === handle),
        )

        return [
          ...clean,
          toFlowEdge({
            id: `e${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`,
            source: connection.source,
            target: connection.target,
            ...(handle ? { sourceHandle: handle } : {}),
          }),
        ]
      })
      setDirty(true)
      setValidation(null)
    },
    [setEdges],
  )

  const addNode = useCallback(
    (type: NodeType, position?: { x: number; y: number }) => {
      const nodeId = newId()
      const count = Object.values(meta).filter((m) => m.type === type).length + 1
      const name = type === 'START' || type === 'END' ? (count === 1 ? NAME_PREFIX[type] : `${NAME_PREFIX[type]}${count}`) : `${NAME_PREFIX[type]}${count}`
      const config = defaultConfigFor(type)
      const where = position ?? { x: 80 + (nodes.length % 4) * 250, y: 80 + Math.floor(nodes.length / 4) * 130 }

      const backendNode: BackendNode = { id: nodeId, type, name, position: where, config }

      setMeta((current) => ({ ...current, [nodeId]: { type, name, config } }))
      setNodes((current) => [...current, toFlowNode(backendNode)])
      setSelectedId(nodeId)
      setDirty(true)
      setValidation(null)
    },
    [meta, nodes.length, setNodes],
  )

  function updateMeta(changes: Partial<Pick<Meta, 'name' | 'config'>>) {
    if (!selectedId) return
    const existing = meta[selectedId]
    if (!existing) return

    const updated: Meta = { ...existing, ...changes }

    setMeta((current) => ({ ...current, [selectedId]: updated }))
    setNodes((current) =>
      current.map((node) =>
        node.id === selectedId
          ? { ...node, data: { ...node.data, label: updated.name, subtitle: nodeSubtitle(updated.type, updated.config) } }
          : node,
      ),
    )
    setDirty(true)
    setValidation(null)
  }

  function deleteSelected() {
    if (!selectedId) return
    setNodes((current) => current.filter((node) => node.id !== selectedId))
    setEdges((current) => current.filter((edge) => edge.source !== selectedId && edge.target !== selectedId))
    setMeta((current) => {
      const rest = { ...current }
      delete rest[selectedId]
      return rest
    })
    setSelectedId(null)
    setDirty(true)
    setValidation(null)
  }

  const buildDefinition = useCallback((): WorkflowDefinition => {
    return {
      nodes: nodes.map((node) => {
        const m = meta[node.id]
        const type = m?.type ?? node.data.kind
        let config = m?.config ?? {}

        if (type === 'API_REQUEST') {
          const c = config as { method: HttpMethod; url: string; headers?: Record<string, string>; body?: string }
          const headers = Object.fromEntries(Object.entries(c.headers ?? {}).filter(([key]) => key.trim()))
          config = {
            method: c.method,
            url: c.url,
            ...(Object.keys(headers).length ? { headers } : {}),
            ...(c.body && c.method !== 'GET' ? { body: c.body } : {}),
          }
        }

        return { id: node.id, type, name: m?.name ?? node.id, position: node.position, config }
      }),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        ...(edge.sourceHandle === 'yes' || edge.sourceHandle === 'no' ? { sourceHandle: edge.sourceHandle } : {}),
      })),
    }
  }, [nodes, edges, meta])

  /** Checks the server cannot see, mostly about {{template}} references. */
  function clientWarnings(definition: WorkflowDefinition): string[] {
    const problems: string[] = []
    const seen = new Set<string>()

    for (const node of definition.nodes) {
      if (seen.has(node.name)) problems.push(`Duplicate node name "${node.name}" — names must be unique.`)
      seen.add(node.name)

      if (node.type !== 'END' && node.type !== 'START' && !IDENTIFIER.test(node.name)) {
        problems.push(`"${node.name}" can't be referenced in {{templates}} — use letters, digits and underscores only.`)
      }
    }

    const known = new Set(definition.nodes.map((n) => n.name))
    const text = JSON.stringify(definition.nodes.map((n) => n.config))

    for (const match of text.matchAll(/\{\{\s*([\w]+)[\w.]*\s*\}\}/g)) {
      if (!known.has(match[1]!)) problems.push(`Template references unknown node "${match[1]}".`)
    }

    return [...new Set(problems)]
  }

  const handleValidate = useCallback(async () => {
    setError('')
    setNotice('')

    const definition = buildDefinition()
    const local = clientWarnings(definition)

    try {
      const response = await apiRequest<ApiResponse<ValidationResult>>(`workflows/${id}/validate`, {
        method: 'POST',
        body: JSON.stringify(definition),
      })
      const errors = [...response.data.errors, ...local]
      setValidation({ valid: errors.length === 0, errors })
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }, [buildDefinition, id])

  const handleSave = useCallback(async (): Promise<boolean> => {
    setSaving(true)
    setError('')
    setNotice('')

    try {
      await apiRequest(`workflows/${id}/definition`, {
        method: 'PUT',
        body: JSON.stringify(buildDefinition()),
      })
      setDirty(false)
      setNotice('Workflow saved.')
      return true
    } catch (err) {
      setError(getErrorMessage(err))
      return false
    } finally {
      setSaving(false)
    }
  }, [buildDefinition, id])

  async function handleRun() {
    setRunning(true)
    setError('')

    const saved = await handleSave()
    if (!saved) {
      setRunning(false)
      return
    }

    try {
      const response = await apiRequest<ApiResponse<{ executionId: string }>>(`workflows/${id}/run`, {
        method: 'POST',
      })
      navigate(`/executions/${response.data.executionId}`)
    } catch (err) {
      setError(getErrorMessage(err))
      setRunning(false)
    }
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        void handleSave()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleSave])

  useEffect(() => {
    if (!dirty) return
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(''), 3000)
    return () => clearTimeout(timer)
  }, [notice])

  function onDrop(event: DragEvent) {
    event.preventDefault()
    const type = event.dataTransfer.getData('application/x-node-type') as NodeType
    if (!type) return
    addNode(type, screenToFlowPosition({ x: event.clientX - 90, y: event.clientY - 20 }))
  }

  const selectedMeta = selectedId ? meta[selectedId] : undefined

  const upstreamRefs = useMemo(
    () =>
      Object.entries(meta)
        .filter(([nodeId, m]) => nodeId !== selectedId && m.type !== 'END' && m.type !== 'START' && IDENTIFIER.test(m.name))
        .flatMap(([, m]) =>
          m.type === 'API_REQUEST'
            ? [`{{${m.name}.body}}`, `{{${m.name}.status}}`]
            : m.type === 'CONDITION'
              ? [`{{${m.name}.result}}`]
              : [],
        ),
    [meta, selectedId],
  )

  function copyRef(ref: string) {
    void navigator.clipboard?.writeText(ref)
    setCopied(ref)
    setTimeout(() => setCopied(''), 1200)
  }

  if (loading) {
    return (
      <div className="page">
        <Loader label="Loading workflow…" />
      </div>
    )
  }

  const nameWarning =
    selectedMeta && selectedMeta.type !== 'END' && selectedMeta.type !== 'START' && !IDENTIFIER.test(selectedMeta.name)

  return (
    <div className="canvas-shell">
      <div className="canvas-bar">
        <Link to="/workflows" className="btn sm ghost">
          <Icon name="arrowLeft" size={15} /> Workflows
        </Link>
        <h1>{workflowName}</h1>
        {dirty ? <span className="badge b-warning">Unsaved changes</span> : <span className="badge b-success">Saved</span>}
        <span className="spacer" />
        {notice && <span className="small" style={{ color: 'var(--success)' }}>✓ {notice}</span>}
        <button type="button" className="btn sm" onClick={() => void handleValidate()}>
          <Icon name="check" size={14} /> Validate
        </button>
        <button type="button" className="btn sm" disabled={saving || !dirty} onClick={() => void handleSave()}>
          <Icon name="save" size={14} /> {saving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" className="btn sm success" disabled={running} onClick={() => void handleRun()}>
          <Icon name="play" size={13} /> {running ? 'Starting…' : 'Save & run'}
        </button>
      </div>

      <div className="canvas-body">
        <aside className="palette">
          <h3>Nodes</h3>
          {PALETTE.map((item) => (
            <button
              key={item.type}
              type="button"
              className="palette-item"
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData('application/x-node-type', item.type)
                event.dataTransfer.effectAllowed = 'move'
              }}
              onClick={() => addNode(item.type)}
              title="Click to add, or drag onto the canvas"
            >
              <span className={`ni k-${item.type}`}>
                <Icon name={KIND_ICON[item.type]} size={16} />
              </span>
              <span>
                {NODE_TYPE_LABELS[item.type]}
                <span className="small muted" style={{ display: 'block', fontWeight: 400, fontSize: 11 }}>
                  {item.hint}
                </span>
              </span>
            </button>
          ))}
          <div className="palette-tip">
            Drag nodes onto the canvas, then connect the dots. A Condition has a green <b>yes</b> and a red <b>no</b>{' '}
            output.
          </div>
        </aside>

        <div className="canvas-main" ref={wrapper}>
          {(validation || error) && (
            <div style={{ position: 'absolute', zIndex: 10, top: 12, left: 12, right: 12, maxWidth: 520 }}>
              {error && <Alert kind="error" onClose={() => setError('')}>{error}</Alert>}
              {validation &&
                (validation.valid ? (
                  <Alert kind="success" onClose={() => setValidation(null)}>Graph is valid and ready to run.</Alert>
                ) : (
                  <Alert kind="warn" onClose={() => setValidation(null)}>
                    <ul>
                      {validation.errors.map((message) => (
                        <li key={message}>{message}</li>
                      ))}
                    </ul>
                  </Alert>
                ))}
            </div>
          )}

          {nodes.length === 0 && <div className="canvas-hint">Empty canvas — add a Start node to begin</div>}

          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_event, node) => setSelectedId(node.id)}
            onPaneClick={() => setSelectedId(null)}
            onDragOver={(event) => {
              event.preventDefault()
              event.dataTransfer.dropEffect = 'move'
            }}
            onDrop={onDrop}
            deleteKeyCode={['Backspace', 'Delete']}
            snapToGrid
            snapGrid={[10, 10]}
            minZoom={0.25}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={22} color="#dfe3ee" />
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable nodeColor="#a5b4fc" maskColor="rgba(240,242,250,.7)" />
          </ReactFlow>
        </div>

        <aside className="config">
          {!selectedMeta ? (
            <div className="center-state">
              <div className="empty-icon">
                <Icon name="layout" size={24} />
              </div>
              <h3>Node settings</h3>
              <p className="small">Select a node on the canvas to configure it.</p>
            </div>
          ) : (
            <>
              <div className="config-head">
                <span className={`ni k-${selectedMeta.type}`}>
                  <Icon name={KIND_ICON[selectedMeta.type]} size={17} />
                </span>
                <h2>{NODE_TYPE_LABELS[selectedMeta.type]}</h2>
                <span className="spacer" />
                <button type="button" className="btn sm icon danger" onClick={deleteSelected} aria-label="Delete node" title="Delete node">
                  <Icon name="trash" size={14} />
                </button>
              </div>

              <div className="config-body">
                <div className="field">
                  <label htmlFor="node-name">Node name</label>
                  <input
                    id="node-name"
                    className="input"
                    value={selectedMeta.name}
                    onChange={(event) => updateMeta({ name: event.target.value })}
                  />
                  {nameWarning ? (
                    <span className="hint warn">Use letters, digits and underscores so other nodes can reference it.</span>
                  ) : selectedMeta.type === 'API_REQUEST' ? (
                    <span className="hint">
                      Later nodes read its result as <code>{`{{${selectedMeta.name}.body}}`}</code>
                    </span>
                  ) : null}
                </div>

                {selectedMeta.type === 'API_REQUEST' && (() => {
                  const config = selectedMeta.config as {
                    method: HttpMethod
                    url: string
                    headers?: Record<string, string>
                    body?: string
                  }
                  const headerRows = Object.entries(config.headers ?? {})

                  return (
                    <>
                      <div className="field-row" style={{ gridTemplateColumns: '110px 1fr' }}>
                        <div className="field">
                          <label htmlFor="node-method">Method</label>
                          <select
                            id="node-method"
                            className="select"
                            style={{ width: '100%', minWidth: 0 }}
                            value={config.method}
                            onChange={(event) => updateMeta({ config: { ...config, method: event.target.value as HttpMethod } })}
                          >
                            {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((method) => (
                              <option key={method}>{method}</option>
                            ))}
                          </select>
                        </div>
                        <div className="field">
                          <label htmlFor="node-url">URL</label>
                          <input
                            id="node-url"
                            className="input mono"
                            placeholder="https://api.example.com/items"
                            value={config.url}
                            onChange={(event) => updateMeta({ config: { ...config, url: event.target.value } })}
                          />
                        </div>
                      </div>

                      <div className="field">
                        <label>Headers</label>
                        {headerRows.map(([key, value], index) => (
                          <div className="kv" key={index}>
                            <input
                              className="input mono"
                              placeholder="Name"
                              value={key}
                              onChange={(event) => {
                                const next = headerRows.map(([k, v], i) => (i === index ? [event.target.value, v] : [k, v]))
                                updateMeta({ config: { ...config, headers: Object.fromEntries(next) } })
                              }}
                            />
                            <input
                              className="input mono"
                              placeholder="Value"
                              value={value}
                              onChange={(event) => {
                                const next = headerRows.map(([k, v], i) => (i === index ? [k, event.target.value] : [k, v]))
                                updateMeta({ config: { ...config, headers: Object.fromEntries(next) } })
                              }}
                            />
                            <button
                              type="button"
                              className="btn icon ghost"
                              aria-label="Remove header"
                              onClick={() =>
                                updateMeta({
                                  config: { ...config, headers: Object.fromEntries(headerRows.filter((_, i) => i !== index)) },
                                })
                              }
                            >
                              <Icon name="x" size={14} />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="btn sm"
                          style={{ alignSelf: 'flex-start' }}
                          onClick={() => updateMeta({ config: { ...config, headers: { ...(config.headers ?? {}), [`Header-${headerRows.length + 1}`]: '' } } })}
                        >
                          <Icon name="plus" size={13} /> Add header
                        </button>
                      </div>

                      {config.method !== 'GET' && (
                        <div className="field">
                          <label htmlFor="node-body">Request body (JSON)</label>
                          <textarea
                            id="node-body"
                            className="textarea mono"
                            rows={6}
                            placeholder={'{"name": "{{previousNode.body.name}}"}'}
                            value={config.body ?? ''}
                            onChange={(event) => updateMeta({ config: { ...config, body: event.target.value } })}
                          />
                        </div>
                      )}

                      {upstreamRefs.length > 0 && (
                        <div className="field">
                          <label>Data from other nodes</label>
                          <div className="refs">
                            {upstreamRefs.map((ref) => (
                              <button type="button" className="chip" key={ref} onClick={() => copyRef(ref)} title="Click to copy">
                                {copied === ref ? 'copied ✓' : ref}
                              </button>
                            ))}
                          </div>
                          <span className="hint">
                            Append a path, e.g. <code>{'{{fetch.body.results.0.name}}'}</code>
                          </span>
                        </div>
                      )}
                    </>
                  )
                })()}

                {selectedMeta.type === 'CONDITION' && (
                  <>
                    <div className="field">
                      <label htmlFor="node-expr">Expression</label>
                      <input
                        id="node-expr"
                        className="input mono"
                        placeholder="{{fetchWeather.body.current.temperature_2m}} >= 30"
                        value={(selectedMeta.config as { expression: string }).expression}
                        onChange={(event) => updateMeta({ config: { expression: event.target.value } })}
                      />
                      <span className="hint">
                        Format: <code>{'{{node.path}}'} OPERATOR value</code> with <code>== != &gt; &lt; &gt;= &lt;=</code>
                      </span>
                    </div>
                    <Alert kind="info">
                      Connect the <b style={{ color: 'var(--success)' }}>yes</b> output (top) and the{' '}
                      <b style={{ color: 'var(--danger)' }}>no</b> output (bottom) to the next steps.
                    </Alert>
                  </>
                )}

                {selectedMeta.type === 'DELAY' && (
                  <div className="field">
                    <label htmlFor="node-ms">Wait (milliseconds)</label>
                    <input
                      id="node-ms"
                      type="number"
                      min={0}
                      className="input"
                      value={(selectedMeta.config as { ms: number }).ms}
                      onChange={(event) => updateMeta({ config: { ms: Number(event.target.value) } })}
                    />
                    <div className="refs" style={{ marginTop: 4 }}>
                      {[
                        ['1 s', 1000],
                        ['5 s', 5000],
                        ['30 s', 30000],
                        ['1 min', 60000],
                      ].map(([label, ms]) => (
                        <button type="button" className="chip" key={label} onClick={() => updateMeta({ config: { ms: Number(ms) } })}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {(selectedMeta.type === 'START' || selectedMeta.type === 'END') && (
                  <p className="small muted">
                    {selectedMeta.type === 'START'
                      ? 'Every workflow has exactly one Start node. Execution begins here.'
                      : 'A path that reaches an End node finishes the run successfully. You can have several.'}
                  </p>
                )}
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}

export default function WorkflowBuilderPage() {
  return (
    <ReactFlowProvider>
      <Builder />
    </ReactFlowProvider>
  )
}
