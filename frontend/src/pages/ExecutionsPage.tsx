import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../services/api/apiClient'
import { Alert, EmptyState, Icon, Loader, PageHeader, Pager, StatusBadge } from '../components/ui'
import {
  formatDateTime,
  formatDuration,
  getErrorMessage,
  type ApiResponse,
  type Paged,
} from '../utils/format'

type ExecutionStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED'

type ExecutionListItem = {
  _id: string
  workflowName: string
  status: ExecutionStatus
  startedAt: string
  finishedAt?: string
  nodeRuns?: { status: string }[]
}

const PAGE_SIZE = 10

export default function ExecutionsPage() {
  const [items, setItems] = useState<ExecutionListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [statusFilter, setStatusFilter] = useState<'' | ExecutionStatus>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true)

      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
      if (statusFilter) params.set('status', statusFilter)

      try {
        const response = await apiRequest<ApiResponse<Paged<ExecutionListItem>>>(
          `executions?${params.toString()}`,
        )
        setItems(response.data.items)
        setTotal(response.data.total)
        setTotalPages(response.data.totalPages)
        setError('')
      } catch (err) {
        setError(getErrorMessage(err))
        setItems([])
      } finally {
        setLoading(false)
      }
    },
    [page, statusFilter],
  )

  useEffect(() => {
    void load()
    const timer = setInterval(() => void load(true), 4000)
    return () => clearInterval(timer)
  }, [load])

  return (
    <div className="page">
      <PageHeader title="Execution history" subtitle="Every workflow run, newest first. Updates automatically." />

      {error && <Alert kind="error">{error}</Alert>}

      <section className="card">
        <div className="toolbar">
          <select
            className="select"
            value={statusFilter}
            aria-label="Filter by status"
            onChange={(event) => {
              setStatusFilter(event.target.value as '' | ExecutionStatus)
              setPage(1)
            }}
          >
            <option value="">All status</option>
            <option value="PENDING">Pending</option>
            <option value="RUNNING">Running</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
          </select>
          <span className="spacer" />
          <button type="button" className="btn" onClick={() => void load()}>
            <Icon name="refresh" size={15} /> Refresh
          </button>
        </div>

        {loading ? (
          <Loader />
        ) : items.length === 0 ? (
          <EmptyState icon="activity" title="No executions yet" text="Run a workflow and its history will appear here." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Run ID</th>
                  <th>Workflow</th>
                  <th>Status</th>
                  <th>Steps</th>
                  <th>Started</th>
                  <th>Duration</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const done = item.nodeRuns?.filter((run) => run.status === 'SUCCESS').length ?? 0
                  const all = item.nodeRuns?.length ?? 0

                  return (
                    <tr key={item._id}>
                      <td className="mono muted">#{item._id.slice(-6)}</td>
                      <td className="cell-title">{item.workflowName}</td>
                      <td><StatusBadge status={item.status} /></td>
                      <td className="muted">{all ? `${done}/${all}` : '—'}</td>
                      <td className="muted">{formatDateTime(item.startedAt)}</td>
                      <td className="muted">{formatDuration(item.startedAt, item.finishedAt)}</td>
                      <td>
                        <div className="row-actions">
                          <Link to={`/executions/${item._id}`} className="btn sm">
                            <Icon name="eye" size={14} /> View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && items.length > 0 && (
          <Pager page={page} totalPages={totalPages} total={total} noun="executions" onChange={setPage} />
        )}
      </section>
    </div>
  )
}
