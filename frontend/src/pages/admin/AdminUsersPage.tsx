import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { adminApiRequest } from '../../services/api/adminApiClient'
import { Alert, EmptyState, Icon, Loader, PageHeader, Pager, StatusBadge } from '../../components/ui'
import { formatDate, getErrorMessage, initials, type ApiResponse, type Paged } from '../../utils/format'

type UserStatus = 'ACTIVE' | 'DISABLED'

type AdminUser = {
  _id: string
  firstName: string
  lastName: string
  email: string
  status: UserStatus
  createdAt: string
  tenantId: { _id: string; name: string; slug: string } | null
}

const PAGE_SIZE = 10

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | UserStatus>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)

    try {
      const response = await adminApiRequest<ApiResponse<Paged<AdminUser>>>(`admin/users?${params.toString()}`)
      setUsers(response.data.items)
      setTotal(response.data.total)
      setTotalPages(response.data.totalPages)
      setError('')
    } catch (err) {
      setError(getErrorMessage(err))
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => {
    void load()
  }, [load])

  async function toggleStatus(user: AdminUser) {
    const next: UserStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
    const fullName = `${user.firstName} ${user.lastName}`

    if (!window.confirm(next === 'DISABLED' ? `Disable "${fullName}"? They will no longer be able to sign in.` : `Enable "${fullName}"?`)) return

    setBusyId(user._id)
    setNotice('')

    try {
      await adminApiRequest(`admin/users/${user._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      })
      setNotice(`"${fullName}" is now ${next.toLowerCase()}.`)
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  async function remove(user: AdminUser) {
    const fullName = `${user.firstName} ${user.lastName}`
    if (!window.confirm(`Permanently delete "${fullName}"? This cannot be undone.`)) return

    setBusyId(user._id)
    setNotice('')

    try {
      await adminApiRequest(`admin/users/${user._id}`, { method: 'DELETE' })
      setNotice(`"${fullName}" was deleted.`)
      if (users.length === 1 && page > 1) setPage((current) => current - 1)
      else await load()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="page">
      <PageHeader title="Users" subtitle="Accounts across every tenant. Changes take effect immediately." />

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
            <input placeholder="Search by name or email…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} aria-label="Search users" />
          </div>
          <select
            className="select"
            value={statusFilter}
            aria-label="Filter by status"
            onChange={(e) => { setStatusFilter(e.target.value as '' | UserStatus); setPage(1) }}
          >
            <option value="">All status</option>
            <option value="ACTIVE">Active</option>
            <option value="DISABLED">Disabled</option>
          </select>
          <button type="submit" className="btn">Search</button>
        </form>

        {loading ? (
          <Loader />
        ) : users.length === 0 ? (
          <EmptyState icon="users" title="No users found" text="Try a different search or filter." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Tenant</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className="row">
                        <span className="avatar">{initials(user.firstName, user.lastName)}</span>
                        <div>
                          <div className="cell-title">{user.firstName} {user.lastName}</div>
                          <div className="small muted">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{user.tenantId?.name ?? <span className="muted">—</span>}</td>
                    <td><StatusBadge status={user.status} /></td>
                    <td className="muted">{formatDate(user.createdAt)}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className={`btn sm ${user.status === 'ACTIVE' ? '' : 'success'}`}
                          disabled={busyId === user._id}
                          onClick={() => void toggleStatus(user)}
                        >
                          {user.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          type="button"
                          className="btn sm icon danger"
                          disabled={busyId === user._id}
                          onClick={() => void remove(user)}
                          aria-label={`Delete ${user.firstName} ${user.lastName}`}
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && users.length > 0 && <Pager page={page} totalPages={totalPages} total={total} noun="users" onChange={setPage} />}
      </section>
    </div>
  )
}
