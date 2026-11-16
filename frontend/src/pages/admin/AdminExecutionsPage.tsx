import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { adminApiRequest } from '../../services/api/adminApiClient'
import { Alert, EmptyState, Icon, Loader, PageHeader, Pager, StatusBadge } from '../../components/ui'
import { formatDateTime, formatDuration, getErrorMessage, type ApiResponse, type Paged } from '../../utils/format'

type AdminExecution = {
  _id: string
  tenantName: string
  workflowName: string
  status: string
  startedAt: string
  finishedAt?: string
  nodeCount: number
  deadLetterCount: number
  error?: string
}

const PAGE_SIZE = 12

export default function AdminExecutionsPage() {
  const [items, setItems] = useState<AdminExecution[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true)
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
      if (search) params.set('search', search)
      if (status) params.set('status', status)

      try {
        const response = await adminApiRequest<ApiResponse<Paged<AdminExecution>>>(`admin/executions?${params.toString()}`)
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
    [page, search, status],
  )

  useEffect(() => {
    void load()
    const timer = setInterval(() => void load(true), 5000)
    return () => clearInterval(timer)
  }, [load])

  return (
    <div className="page">
      <PageHeader title="Executions" subtitle="Monitor every workflow run across all tenants. Refreshes automatically." />

      {error && <Alert kind="error">{error}</Alert>}

      <section className="card">
        <form
          className="toolbar"
          onSubmit={(event: FormEvent) => {
            event.preventDefault()
            setPage(1)
            setSearch(searchInput.trim())
          }}
        >
          <div className="search">
            <Icon name="search" size={16} />
            <input placeholder="Search by workflow name…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} aria-label="Search executions" />
          </div>
          <select className="select" value={status} aria-label="Filter by status" onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
            <option value="">All status</option>
            <option value="PENDING">Pending</option>
            <option value="RUNNING">Running</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
          </select>
          <button type="submit" className="btn">Search</button>
        </form>

        {loading ? (
          <Loader />
        ) : items.length === 0 ? (
          <EmptyState icon="activity" title="No executions found" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Run</th>
                  <th>Workflow</th>
                  <th>Tenant</th>
                  <th>Status</th>
                  <th>Started</th>
                  <th>Duration</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id}>
                    <td className="mono muted">#{item._id.slice(-6)}</td>
                    <td className="cell-title">{item.workflowName}</td>
                    <td>{item.tenantName}</td>
                    <td><StatusBadge status={item.status} /></td>
                    <td className="muted">{formatDateTime(item.startedAt)}</td>
                    <td className="muted">{formatDuration(item.startedAt, item.finishedAt)}</td>
                    <td>
                      {item.deadLetterCount > 0 ? (
                        <span className="badge b-dark" title={item.error}>DLQ · {item.deadLetterCount}</span>
                      ) : item.error ? (
                        <span className="cell-sub" title={item.error}>{item.error}</span>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && items.length > 0 && <Pager page={page} totalPages={totalPages} total={total} noun="executions" onChange={setPage} />}
      </section>
    </div>
  )
}
