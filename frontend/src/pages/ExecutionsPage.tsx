
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../services/api/apiClient'

type ExecutionStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED'

type ExecutionListItem = {
  _id: string
  workflowName: string
  status: ExecutionStatus
  startedAt: string
  finishedAt?: string
}

type ExecutionListData = {
  items: ExecutionListItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

type ApiResponse<T> = { success: boolean; data: T }

const PAGE_SIZE = 10

const STATUS_BADGE: Record<ExecutionStatus, string> = {
  PENDING: 'bg-secondary',
  RUNNING: 'bg-primary',
  SUCCESS: 'bg-success',
  FAILED: 'bg-danger',
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.'
}

export default function ExecutionsPage() {
  const [executions, setExecutions] = useState<ExecutionListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [statusFilter, setStatusFilter] = useState<'' | ExecutionStatus>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
    if (statusFilter) params.set('status', statusFilter)

    try {
      const response = await apiRequest<ApiResponse<ExecutionListData>>(
        `executions?${params.toString()}`,
      )
      setExecutions(response.data.items)
      setTotal(response.data.total)
      setTotalPages(response.data.totalPages)
    } catch (err) {
      setError(getErrorMessage(err))
      setExecutions([])
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="container-fluid py-3">
      <h1>Executions</h1>

      <select
        className="form-select mb-3"
        style={{ maxWidth: 200 }}
        value={statusFilter}
        onChange={(event) => {
          setStatusFilter(event.target.value as '' | ExecutionStatus)
          setPage(1)
        }}
      >
        <option value="">All statuses</option>
        <option value="PENDING">Pending</option>
        <option value="RUNNING">Running</option>
        <option value="SUCCESS">Success</option>
        <option value="FAILED">Failed</option>
      </select>

      {error && <div className="alert alert-danger py-2">{error}</div>}
      {loading && <p>Loading…</p>}

      {!loading && executions.length === 0 && !error && <p>No executions yet.</p>}

      {!loading && executions.length > 0 && (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Workflow</th>
                <th>Status</th>
                <th>Started</th>
                <th>Finished</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {executions.map((execution) => (
                <tr key={execution._id}>
                  <td>{execution.workflowName}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[execution.status]}`}>{execution.status}</span>
                  </td>
                  <td>{new Date(execution.startedAt).toLocaleString()}</td>
                  <td>{execution.finishedAt ? new Date(execution.finishedAt).toLocaleString() : '—'}</td>
                  <td>
                    <Link to={`/executions/${execution._id}`}>View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="d-flex justify-content-between align-items-center">
            <span>{total} total</span>
            <div className="d-flex gap-2 align-items-center">
              <button
                type="button"
                className="btn btn-sm btn-light border"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                ← Previous
              </button>
              <span>Page {page} of {Math.max(totalPages, 1)}</span>
              <button
                type="button"
                className="btn btn-sm btn-light border"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
