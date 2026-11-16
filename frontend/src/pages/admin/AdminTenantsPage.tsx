import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { adminApiRequest } from '../../services/api/adminApiClient'
import { Alert, EmptyState, Icon, Loader, PageHeader, Pager, StatusBadge } from '../../components/ui'
import { formatDate, getErrorMessage, type ApiResponse, type Paged } from '../../utils/format'

type Tenant = {
  _id: string
  name: string
  slug: string
  status: 'ACTIVE' | 'DISABLED'
  createdAt: string
  userCount: number
  workflowCount: number
  executionCount: number
}

const PAGE_SIZE = 10

export default function AdminTenantsPage() {
  const [items, setItems] = useState<Tenant[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
    if (search) params.set('search', search)
    if (status) params.set('status', status)

    try {
      const response = await adminApiRequest<ApiResponse<Paged<Tenant>>>(`admin/tenants?${params.toString()}`)
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
  }, [page, search, status])

  useEffect(() => {
    void load()
  }, [load])

  async function toggle(tenant: Tenant) {
    const next = tenant.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
    const ok = window.confirm(
      next === 'DISABLED'
        ? `Disable "${tenant.name}"? None of its users will be able to use the platform.`
        : `Re-enable "${tenant.name}"?`,
    )
    if (!ok) return

    setBusyId(tenant._id)
    setNotice('')

    try {
      await adminApiRequest(`admin/tenants/${tenant._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      })
      setNotice(`"${tenant.name}" is now ${next.toLowerCase()}.`)
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="page">
      <PageHeader title="Tenants" subtitle="Every workspace on the platform, with usage at a glance." />

      {notice && <Alert kind="success" onClose={() => setNotice('')}>{notice}</Alert>}
      {error && <Alert kind="error" onClose={() => setError('')}>{error}</Alert>}

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
            <input placeholder="Search by name or slug…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} aria-label="Search tenants" />
          </div>
          <select className="select" value={status} aria-label="Filter by status" onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
            <option value="">All status</option>
            <option value="ACTIVE">Active</option>
            <option value="DISABLED">Disabled</option>
          </select>
          <button type="submit" className="btn">Search</button>
        </form>

        {loading ? (
          <Loader />
        ) : items.length === 0 ? (
          <EmptyState icon="building" title="No tenants found" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Status</th>
                  <th className="num">Users</th>
                  <th className="num">Workflows</th>
                  <th className="num">Executions</th>
                  <th>Created</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((tenant) => (
                  <tr key={tenant._id}>
                    <td>
                      <div className="row">
                        <span className="avatar" style={{ width: 34, height: 34, borderRadius: 10 }}>{tenant.name.slice(0, 2).toUpperCase()}</span>
                        <div>
                          <div className="cell-title">{tenant.name}</div>
                          <div className="small muted mono">{tenant.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td><StatusBadge status={tenant.status} /></td>
                    <td className="num">{tenant.userCount}</td>
                    <td className="num">{tenant.workflowCount}</td>
                    <td className="num">{tenant.executionCount}</td>
                    <td className="muted">{formatDate(tenant.createdAt)}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className={`btn sm ${tenant.status === 'ACTIVE' ? 'danger' : ''}`}
                          disabled={busyId === tenant._id}
                          onClick={() => void toggle(tenant)}
                        >
                          <Icon name={tenant.status === 'ACTIVE' ? 'ban' : 'check'} size={14} />
                          {tenant.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && items.length > 0 && <Pager page={page} totalPages={totalPages} total={total} noun="tenants" onChange={setPage} />}
      </section>
    </div>
  )
}
