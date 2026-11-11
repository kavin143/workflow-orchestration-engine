
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useAdminAuth } from '../../features/admin/AdminAuthContext'
import { adminApiRequest } from '../../services/api/adminApiClient'

type UserStatus = 'ACTIVE' | 'DISABLED'

type AdminUser = {
  _id: string
  firstName: string
  lastName: string
  email: string
  status: UserStatus
  createdAt: string
  tenantId: {
    _id: string
    name: string
    slug: string
  } | null
}

type UserListData = {
  items: AdminUser[]
  total: number
  page: number
  limit: number
  totalPages: number
}

type ApiResponse<T> = {
  success: boolean
  data: T
}

const PAGE_SIZE = 10

function formatDate(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.'
}

export default function AdminUsersPage() {
  const { logout } = useAdminAuth()

  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | UserStatus>('')

  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [notice, setNotice] = useState('')

  const [busyUserId, setBusyUserId] = useState<string | null>(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setPageError('')

    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
    })

    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)

    try {
      const response = await adminApiRequest<ApiResponse<UserListData>>(
        `admin/users?${params.toString()}`,
      )

      setUsers(response.data.items)
      setTotal(response.data.total)
      setPage(response.data.page)
      setTotalPages(response.data.totalPages)
    } catch (error) {
      setPageError(getErrorMessage(error))
      setUsers([])
      setTotal(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
    setNotice('')
  }

  async function handleToggleStatus(user: AdminUser) {
    const nextStatus: UserStatus =
      user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'

    const confirmed = window.confirm(
      nextStatus === 'DISABLED'
        ? `Disable "${user.firstName} ${user.lastName}"? They will no longer be able to sign in.`
        : `Enable "${user.firstName} ${user.lastName}"?`,
    )

    if (!confirmed) return

    setBusyUserId(user._id)
    setPageError('')
    setNotice('')

    try {
      await adminApiRequest(`admin/users/${user._id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      })

      setNotice(`"${user.firstName} ${user.lastName}" is now ${nextStatus.toLowerCase()}.`)
      await loadUsers()
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setBusyUserId(null)
    }
  }

  async function handleDelete(user: AdminUser) {
    const confirmed = window.confirm(
      `Permanently delete "${user.firstName} ${user.lastName}"? This cannot be undone.`,
    )

    if (!confirmed) return

    setBusyUserId(user._id)
    setPageError('')
    setNotice('')

    try {
      await adminApiRequest(`admin/users/${user._id}`, { method: 'DELETE' })

      setNotice(`"${user.firstName} ${user.lastName}" was deleted.`)

      if (users.length === 1 && page > 1) {
        setPage((current) => current - 1)
      } else {
        await loadUsers()
      }
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setBusyUserId(null)
    }
  }

  return (
    <main className="page">
      <section className="panel">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1>Admin Panel — Users</h1>
          <button type="button" className="btn btn-outline-secondary" onClick={logout}>
            Log out
          </button>
        </div>

        <p>Manage user accounts across every tenant workspace.</p>

        <form className="d-flex gap-2 mb-3" onSubmit={handleSearchSubmit}>
          <input
            className="form-control"
            aria-label="Search users"
            placeholder="Search by name or email…"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />

          <select
            className="form-select"
            aria-label="Filter by status"
            style={{ maxWidth: 160 }}
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as '' | UserStatus)
              setPage(1)
            }}
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DISABLED">Disabled</option>
          </select>

          <button type="submit" className="btn btn-light border">
            Search
          </button>
        </form>

        {notice && (
          <div className="alert alert-success py-2" role="status">
            {notice}
          </div>
        )}

        {pageError && (
          <div className="alert alert-danger py-2" role="alert">
            {pageError}
          </div>
        )}

        {loading && (
          <div role="status">
            <span className="spinner-border spinner-border-sm text-primary" /> Loading users…
          </div>
        )}

        {!loading && users.length === 0 && !pageError && (
          <p>No users found.</p>
        )}

        {!loading && users.length > 0 && (
          <>
            <table className="table align-middle">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Tenant</th>
                  <th scope="col">Status</th>
                  <th scope="col">Joined</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.firstName} {user.lastName}</td>
                    <td>{user.email}</td>
                    <td>{user.tenantId?.name ?? '—'}</td>
                    <td>
                      <span
                        className={`badge ${user.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          disabled={busyUserId === user._id}
                          onClick={() => void handleToggleStatus(user)}
                        >
                          {user.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          disabled={busyUserId === user._id}
                          onClick={() => void handleDelete(user)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <footer className="d-flex justify-content-between align-items-center">
              <span>
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min((page - 1) * PAGE_SIZE + users.length, total)} of {total}
              </span>

              <div className="d-flex gap-2 align-items-center">
                <button
                  type="button"
                  className="btn btn-sm btn-light border"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  ← Previous
                </button>
                <span>Page {page} of {Math.max(totalPages, 1)}</span>
                <button
                  type="button"
                  className="btn btn-sm btn-light border"
                  disabled={page >= totalPages || loading || totalPages === 0}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                >
                  Next →
                </button>
              </div>
            </footer>
          </>
        )}
      </section>
    </main>
  )
}
