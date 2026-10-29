import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../services/api/apiClient'
import styles from '../styles/pages/WorkflowsPage.module.css'

type WorkflowStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED'

type Workflow = {
  _id: string
  name: string
  description: string
  status: WorkflowStatus
  createdAt: string
  updatedAt: string
}

type WorkflowListData = {
  items: Workflow[]
  total: number
  page: number
  limit: number
  totalPages: number
}

type ApiResponse<T> = {
  success: boolean
  data: T
  message?: string
}

type WorkflowForm = {
  name: string
  description: string
}

const PAGE_SIZE = 10

const EMPTY_FORM: WorkflowForm = {
  name: '',
  description: '',
}

const STATUS_LABELS: Record<WorkflowStatus, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  ARCHIVED: 'Archived',
}

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

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | WorkflowStatus>('')

  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [notice, setNotice] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null)
  const [form, setForm] = useState<WorkflowForm>(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [archiveError, setArchiveError] = useState('')

  const loadWorkflows = useCallback(async () => {
    setLoading(true)
    setPageError('')

    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
    })

    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)

    try {
      const response = await apiRequest<ApiResponse<WorkflowListData>>(
        `workflows?${params.toString()}`,
      )

      setWorkflows(response.data.items)
      setTotal(response.data.total)
      setPage(response.data.page)
      setTotalPages(response.data.totalPages)
    } catch (error) {
      setPageError(getErrorMessage(error))
      setWorkflows([])
      setTotal(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => {
    void loadWorkflows()
  }, [loadWorkflows])

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
    setNotice('')
  }

  function openCreateForm() {
    setEditingWorkflow(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setNotice('')
    setFormOpen(true)
  }

  function openEditForm(workflow: Workflow) {
    setEditingWorkflow(workflow)
    setForm({
      name: workflow.name,
      description: workflow.description,
    })
    setFormError('')
    setNotice('')
    setFormOpen(true)
  }

  function closeForm() {
    if (saving) return

    setFormOpen(false)
    setEditingWorkflow(null)
    setForm(EMPTY_FORM)
    setFormError('')
  }

  async function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    setNotice('')

    const name = form.name.trim()
    const description = form.description.trim()

    if (name.length < 3 || name.length > 100) {
      setFormError('Name must contain between 3 and 100 characters.')
      return
    }

    if (description.length > 1000) {
      setFormError('Description cannot exceed 1000 characters.')
      return
    }

    setSaving(true)

    try {
      if (editingWorkflow) {
        await apiRequest<ApiResponse<Workflow>>(
          `workflows/${editingWorkflow._id}`,
          {
            method: 'PATCH',
            body: JSON.stringify({ name, description }),
          },
        )
        setNotice('Workflow updated successfully.')
      } else {
        await apiRequest<ApiResponse<Workflow>>('workflows', {
          method: 'POST',
          body: JSON.stringify({ name, description }),
        })
        setNotice('Workflow created successfully.')
      }

      setFormOpen(false)
      setEditingWorkflow(null)
      setForm(EMPTY_FORM)
      setPage(1)
      setSearch('')
      setSearchInput('')
      setStatusFilter('')
      await loadWorkflows()
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  async function handleArchive(workflow: Workflow) {
    const confirmed = window.confirm(
      `Archive "${workflow.name}"? It will no longer be editable.`,
    )

    if (!confirmed) return

    setArchivingId(workflow._id)
    setArchiveError('')
    setNotice('')

    try {
      await apiRequest<ApiResponse<Workflow>>(
        `workflows/${workflow._id}`,
        { method: 'DELETE' },
      )

      setNotice(`"${workflow.name}" was archived.`)

      if (workflows.length === 1 && page > 1) {
        setPage((current) => current - 1)
      } else {
        await loadWorkflows()
      }
    } catch (error) {
      setArchiveError(getErrorMessage(error))
    } finally {
      setArchivingId(null)
    }
  }

  const draftCount = workflows.filter((item) => item.status === 'DRAFT').length
  const activeCount = workflows.filter((item) => item.status === 'ACTIVE').length
  const archivedCount = workflows.filter((item) => item.status === 'ARCHIVED').length

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <Link to="/dashboard" className={styles.brand}>
            <span className={styles.brandMark}>Z</span>
            <span>
              <strong>Zaalima</strong>
              <small>Workflow Engine</small>
            </span>
          </Link>

          <nav className={styles.topLinks} aria-label="Main navigation">
            <Link to="/dashboard">Dashboard</Link>
            <span className={styles.activeLink}>Workflows</span>
            <Link to="/executions">Executions</Link>
          </nav>

          <span className={styles.environmentBadge}>
            <span />
            Workspace
          </span>
        </header>

        <section className={styles.content}>
          <div className={styles.breadcrumb}>
            <Link to="/dashboard">Dashboard</Link>
            <span>/</span>
            <span>Workflows</span>
          </div>

          <div className={styles.headingRow}>
            <div>
              <div className={styles.eyebrow}>AUTOMATION MANAGEMENT</div>
              <h1>Workflows</h1>
              <p className={styles.subtitle}>
                Build, organize, and manage your workflow definitions.
              </p>
            </div>

            <button
              type="button"
              className={`btn ${styles.primaryButton}`}
              onClick={openCreateForm}
            >
              <span aria-hidden="true">＋</span> New workflow
            </button>
          </div>

          <section className={styles.metrics} aria-label="Workflow summary">
            <article className={styles.metricCard}>
              <div className={styles.metricLabel}>Total matching</div>
              <div className={styles.metricBottom}>
                <strong>{total}</strong>
                <span className={styles.metricIcon}>▤</span>
              </div>
            </article>
            <article className={styles.metricCard}>
              <div className={styles.metricLabel}>Drafts on this page</div>
              <div className={styles.metricBottom}>
                <strong>{draftCount}</strong>
                <span className={`${styles.metricIcon} ${styles.draftIcon}`}>◷</span>
              </div>
            </article>
            <article className={styles.metricCard}>
              <div className={styles.metricLabel}>Active on this page</div>
              <div className={styles.metricBottom}>
                <strong>{activeCount}</strong>
                <span className={`${styles.metricIcon} ${styles.activeIcon}`}>↗</span>
              </div>
            </article>
            <article className={styles.metricCard}>
              <div className={styles.metricLabel}>Archived on this page</div>
              <div className={styles.metricBottom}>
                <strong>{archivedCount}</strong>
                <span className={`${styles.metricIcon} ${styles.archivedIcon}`}>▣</span>
              </div>
            </article>
          </section>

          {notice && (
            <div className="alert alert-success py-2" role="status">
              {notice}
            </div>
          )}

          {archiveError && (
            <div className="alert alert-danger py-2" role="alert">
              {archiveError}
              <button
                type="button"
                className="btn-close float-end"
                aria-label="Dismiss error"
                onClick={() => setArchiveError('')}
              />
            </div>
          )}

          {formOpen && (
            <section className={styles.formCard}>
              <div className={styles.formHeader}>
                <div>
                  <span className={styles.eyebrow}>
                    {editingWorkflow ? 'WORKFLOW SETTINGS' : 'GET STARTED'}
                  </span>
                  <h2>{editingWorkflow ? 'Edit workflow' : 'Create a workflow'}</h2>
                  <p>
                    {editingWorkflow
                      ? 'Update the workflow name and description.'
                      : 'Start with a clear name and a short description.'}
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.closeButton}
                  onClick={closeForm}
                  aria-label="Close form"
                  disabled={saving}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleFormSubmit}>
                <div className="mb-3">
                  <label htmlFor="workflow-name" className="form-label">
                    Workflow name <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="workflow-name"
                    className="form-control"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="e.g. Customer onboarding"
                    minLength={3}
                    maxLength={100}
                    required
                    autoFocus
                  />
                  <div className={styles.fieldHint}>
                    {form.name.length}/100 characters
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="workflow-description" className="form-label">
                    Description
                  </label>
                  <textarea
                    id="workflow-description"
                    className="form-control"
                    rows={3}
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="What does this workflow do?"
                    maxLength={1000}
                  />
                  <div className={styles.fieldHint}>
                    {form.description.length}/1000 characters
                  </div>
                </div>

                {formError && (
                  <div className="alert alert-danger py-2" role="alert">
                    {formError}
                  </div>
                )}

                <div className={styles.formActions}>
                  <button
                    type="button"
                    className="btn btn-light border"
                    onClick={closeForm}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`btn ${styles.primaryButton}`}
                    disabled={saving}
                  >
                    {saving
                      ? 'Saving…'
                      : editingWorkflow
                        ? 'Save changes'
                        : 'Create workflow'}
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className={styles.listCard}>
            <div className={styles.listHeader}>
              <div>
                <h2>All workflows</h2>
                <p>Manage your workflow definitions and their current status.</p>
              </div>
              <span className={styles.resultCount}>
                {total} {total === 1 ? 'workflow' : 'workflows'}
              </span>
            </div>

            <form className={styles.filters} onSubmit={handleSearchSubmit}>
              <div className={styles.searchBox}>
                <span aria-hidden="true">⌕</span>
                <input
                  aria-label="Search workflows"
                  placeholder="Search by workflow name…"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                />
                {searchInput && (
                  <button
                    type="button"
                    className={styles.clearSearch}
                    aria-label="Clear search"
                    onClick={() => {
                      setSearchInput('')
                      setSearch('')
                      setPage(1)
                    }}
                  >
                    ×
                  </button>
                )}
              </div>

              <select
                className={`form-select ${styles.statusSelect}`}
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as '' | WorkflowStatus)
                  setPage(1)
                }}
              >
                <option value="">All statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
              </select>

              <button type="submit" className="btn btn-light border">
                Search
              </button>
            </form>

            {pageError && (
              <div className={styles.errorState} role="alert">
                <div className={styles.errorSymbol}>!</div>
                <h3>Couldn't load workflows</h3>
                <p>{pageError}</p>
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => void loadWorkflows()}
                >
                  Try again
                </button>
              </div>
            )}

            {!pageError && loading && (
              <div className={styles.loadingState} role="status">
                <div className="spinner-border spinner-border-sm text-primary" />
                <span>Loading workflows…</span>
              </div>
            )}

            {!pageError && !loading && workflows.length === 0 && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>▤</div>
                <h3>
                  {search || statusFilter
                    ? 'No matching workflows'
                    : 'Your workflows start here'}
                </h3>
                <p>
                  {search || statusFilter
                    ? 'Try another search term or change the status filter.'
                    : 'Create your first workflow to begin organizing automation.'}
                </p>
                {search || statusFilter ? (
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => {
                      setSearch('')
                      setSearchInput('')
                      setStatusFilter('')
                      setPage(1)
                    }}
                  >
                    Clear filters
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`btn ${styles.primaryButton}`}
                    onClick={openCreateForm}
                  >
                    ＋ Create your first workflow
                  </button>
                )}
              </div>
            )}

            {!pageError && !loading && workflows.length > 0 && (
              <>
                <div className={styles.tableWrap}>
                  <table className={`table align-middle mb-0 ${styles.workflowTable}`}>
                    <thead>
                      <tr>
                        <th scope="col">Workflow</th>
                        <th scope="col">Status</th>
                        <th scope="col">Last updated</th>
                        <th scope="col" className={styles.actionsHeading}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {workflows.map((workflow) => (
                        <tr key={workflow._id}>
                          <td>
                            <div className={styles.workflowIdentity}>
                              <span className={styles.workflowIcon}>↗</span>
                              <div className={styles.workflowInfo}>
                                <strong>{workflow.name}</strong>
                                <span>
                                  {workflow.description || 'No description provided'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span
                              className={`${styles.statusBadge} ${
                                workflow.status === 'ACTIVE'
                                  ? styles.statusActive
                                  : workflow.status === 'ARCHIVED'
                                    ? styles.statusArchived
                                    : styles.statusDraft
                              }`}
                            >
                              <span />
                              {STATUS_LABELS[workflow.status]}
                            </span>
                          </td>
                          <td className={styles.dateCell}>
                            {formatDate(workflow.updatedAt)}
                          </td>
                          <td>
                            <div className={styles.rowActions}>
                              {workflow.status !== 'ARCHIVED' ? (
                                <>
                                  <button
                                    type="button"
                                    className={styles.actionButton}
                                    onClick={() => openEditForm(workflow)}
                                    aria-label={`Edit ${workflow.name}`}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className={`${styles.actionButton} ${styles.archiveAction}`}
                                    onClick={() => void handleArchive(workflow)}
                                    disabled={archivingId === workflow._id}
                                    aria-label={`Archive ${workflow.name}`}
                                  >
                                    {archivingId === workflow._id
                                      ? 'Archiving…'
                                      : 'Archive'}
                                  </button>
                                </>
                              ) : (
                                <span className={styles.readOnlyLabel}>
                                  Read only
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <footer className={styles.pagination}>
                  <span>
                    Showing <strong>{(page - 1) * PAGE_SIZE + 1}</strong>–
                    <strong>{Math.min((page - 1) * PAGE_SIZE + workflows.length, total)}</strong>
                    {' '}of <strong>{total}</strong>
                  </span>

                  <div className={styles.paginationControls}>
                    <button
                      type="button"
                      className="btn btn-sm btn-light border"
                      disabled={page <= 1 || loading}
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                    >
                      ← Previous
                    </button>
                    <span>
                      Page {page} of {Math.max(totalPages, 1)}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-light border"
                      disabled={page >= totalPages || loading || totalPages === 0}
                      onClick={() =>
                        setPage((current) => Math.min(totalPages, current + 1))
                      }
                    >
                      Next →
                    </button>
                  </div>
                </footer>
              </>
            )}
          </section>

          <footer className={styles.pageFooter}>
            <span>Zaalima Workflow Orchestration Engine</span>
            <span>Workflow management</span>
          </footer>
        </section>
      </div>
    </main>
  )
}