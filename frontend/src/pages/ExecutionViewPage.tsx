
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiRequest } from '../services/api/apiClient'

type ExecutionStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED'
type NodeRunStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'RETRYING' | 'DEAD_LETTER'

type NodeRun = {
  nodeId: string
  name: string
  type: string
  status: NodeRunStatus
  attempt: number
  maxAttempts: number
  error?: string
}

type LogEntry = { timestamp: string; message: string }

type ExecutionDetail = {
  _id: string
  workflowId: string
  workflowName: string
  status: ExecutionStatus
  startedAt: string
  finishedAt?: string
  nodeRuns: NodeRun[]
  logs: LogEntry[]
}

type ApiResponse<T> = { success: boolean; data: T }

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-secondary',
  RUNNING: 'bg-primary',
  SUCCESS: 'bg-success',
  FAILED: 'bg-danger',
  RETRYING: 'bg-warning text-dark',
  DEAD_LETTER: 'bg-dark',
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.'
}

export default function ExecutionViewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [execution, setExecution] = useState<ExecutionDetail | null>(null)
  const [error, setError] = useState('')
  const [rerunning, setRerunning] = useState(false)

  const load = useCallback(async () => {
    if (!id) return

    try {
      const response = await apiRequest<ApiResponse<ExecutionDetail>>(`executions/${id}`)
      setExecution(response.data)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!execution || execution.status === 'SUCCESS' || execution.status === 'FAILED') {
      return
    }

    const timer = setInterval(() => void load(), 2000)
    return () => clearInterval(timer)
  }, [execution, load])

  async function handleRerun() {
    if (!id) return

    setRerunning(true)
    setError('')

    try {
      const response = await apiRequest<ApiResponse<{ executionId: string }>>(
        `executions/${id}/rerun`,
        { method: 'POST' },
      )
      navigate(`/executions/${response.data.executionId}`)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setRerunning(false)
    }
  }

  if (error) {
    return (
      <div className="container-fluid py-3">
        <div className="alert alert-danger">{error}</div>
        <Link to="/executions">Back to executions</Link>
      </div>
    )
  }

  if (!execution) {
    return <div className="container-fluid py-3">Loading execution…</div>
  }

  return (
    <div className="container-fluid py-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h1>
          Execution: {execution.workflowName}{' '}
          <span className={`badge ${STATUS_BADGE[execution.status]}`}>{execution.status}</span>
        </h1>
        {execution.status === 'FAILED' && (
          <button type="button" className="btn btn-sm btn-outline-primary" disabled={rerunning} onClick={() => void handleRerun()}>
            {rerunning ? 'Re-running…' : 'Re-run'}
          </button>
        )}
      </div>

      <p className="text-muted">
        Started {new Date(execution.startedAt).toLocaleString()}
        {execution.finishedAt && <> · Finished {new Date(execution.finishedAt).toLocaleString()}</>}
      </p>

      <h2 className="h6">Nodes</h2>
      <table className="table table-sm">
        <thead>
          <tr>
            <th>Node</th>
            <th>Type</th>
            <th>Status</th>
            <th>Attempt</th>
            <th>Error</th>
          </tr>
        </thead>
        <tbody>
          {execution.nodeRuns.map((nodeRun) => (
            <tr key={nodeRun.nodeId}>
              <td>{nodeRun.name}</td>
              <td>{nodeRun.type}</td>
              <td>
                <span className={`badge ${STATUS_BADGE[nodeRun.status]}`}>{nodeRun.status}</span>
              </td>
              <td>{nodeRun.attempt}/{nodeRun.maxAttempts}</td>
              <td className="text-danger">{nodeRun.error ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="h6">Execution Logs</h2>
      <ul className="list-group" style={{ maxHeight: 260, overflowY: 'auto' }}>
        {execution.logs.map((log, index) => (
          <li key={index} className="list-group-item">
            <span className="text-muted">{new Date(log.timestamp).toLocaleTimeString()}</span> — {log.message}
          </li>
        ))}
      </ul>
    </div>
  )
}
