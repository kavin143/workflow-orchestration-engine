import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest } from '../services/api/apiClient'
import {
  Alert,
  EmptyState,
  Icon,
  Loader,
  Modal,
  PageHeader,
  Pager,
  StatusBadge,
} from '../components/ui'
import { buildWeatherAlertDefinition } from '../templates/weatherAlert'
import {
  formatDate,
  getErrorMessage,
  type ApiResponse,
  type Paged,
} from '../utils/format'

type WorkflowStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED'

type Workflow = {
  _id: string
  name: string
  description: string
  status: WorkflowStatus
  createdAt: string
  updatedAt: string
}

const PAGE_SIZE = 10

export default function WorkflowsPage() {
  const navigate = useNavigate()

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
  const [busyId, setBusyId] = useState<string | null>(null)

  // create / edit modal
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Workflow | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  // template modal
  const [templateOpen, setTemplateOpen] = useState(false)
  const [city, setCity] = useState('Chennai')
  const [threshold, setThreshold] = useState(30)
  const [templateError, setTemplateError] = useState('')
  const [creatingTemplate, setCreatingTemplate] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setPageError('')

    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)

    try {
      const response = await apiRequest<ApiResponse<Paged<Workflow>>>(`workflows?${params.toString()}`)
      setWorkflows(response.data.items)
      setTotal(response.data.total)
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
    void load()
  }, [load])

  function openCreate() {
    setEditing(null)
    setName('')
    setDescription('')
    setFormError('')
    setFormOpen(true)
  }

  function openEdit(workflow: Workflow) {
    setEditing(workflow)
    setName(workflow.name)
    setDescription(workflow.description)
    setFormError('')
    setFormOpen(true)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')

    const trimmedName = name.trim()
    const trimmedDescription = description.trim()

    if (trimmedName.length < 3 || trimmedName.length > 100) {
      setFormError('Name must contain between 3 and 100 characters.')
      return
    }

    setSaving(true)

    try {
      if (editing) {
        await apiRequest(`workflows/${editing._id}`, {
          method: 'PATCH',
          body: JSON.stringify({ name: trimmedName, description: trimmedDescription }),
        })
        setNotice('Workflow updated.')
        setFormOpen(false)
        await load()
      } else {
        const created = await apiRequest<ApiResponse<Workflow>>('workflows', {
          method: 'POST',
          body: JSON.stringify({ name: trimmedName, description: trimmedDescription }),
        })
        navigate(`/workflows/${created.data._id}/builder`)
      }
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateFromTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTemplateError('')

    if (!city.trim()) {
      setTemplateError('Enter a city name.')
      return
    }

    setCreatingTemplate(true)

    try {
      const created = await apiRequest<ApiResponse<Workflow>>('workflows', {
        method: 'POST',
        body: JSON.stringify({
          name: `Live Weather Alert — ${city.trim()}`,
          description: `Real workflow, no API keys: geocodes ${city.trim()}, fetches its live temperature from Open-Meteo, posts a report, then raises a heat alert at ${threshold}°C or above.`,
        }),
      })

      const id = created.data._id

      await apiRequest(`workflows/${id}/definition`, {
        method: 'PUT',
        body: JSON.stringify(buildWeatherAlertDefinition({ city: city.trim(), thresholdC: threshold })),
      })
      await apiRequest(`workflows/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'ACTIVE' }),
      })

      const run = await apiRequest<ApiResponse<{ executionId: string }>>(`workflows/${id}/run`, {
        method: 'POST',
      })

      navigate(`/executions/${run.data.executionId}`)
    } catch (error) {
      setTemplateError(getErrorMessage(error))
      setCreatingTemplate(false)
    }
  }

  async function handleRun(workflow: Workflow) {
    setBusyId(workflow._id)
    setPageError('')
    setNotice('')

    try {
      const run = await apiRequest<ApiResponse<{ executionId: string }>>(
        `workflows/${workflow._id}/run`,
        { method: 'POST' },
      )
      navigate(`/executions/${run.data.executionId}`)
    } catch (error) {
      setPageError(getErrorMessage(error))
      setBusyId(null)
    }
  }

  async function handleArchive(workflow: Workflow) {
    if (!window.confirm(`Archive "${workflow.name}"? It will no longer be editable.`)) return

    setBusyId(workflow._id)
    setPageError('')

    try {
      await apiRequest(`workflows/${workflow._id}`, { method: 'DELETE' })
      setNotice(`"${workflow.name}" was archived.`)

      if (workflows.length === 1 && page > 1) setPage((current) => current - 1)
      else await load()
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="Workflows"
        subtitle="Build, run and manage your automation workflows."
        actions={
          <>
            <button type="button" className="btn primary" onClick={openCreate}>
              <Icon name="plus" size={16} /> Create workflow
            </button>
          </>
        }
      />

      <div className="template">
        <div className="t-icon">
          <Icon name="cloud" size={24} />
        </div>
        <div>
          <h3>Live Weather Alert — a real workflow, no API keys</h3>
          <p>
            Geocode a city, fetch its live temperature, post a report and branch on a heat
            threshold. Creates the workflow and runs it immediately.
          </p>
        </div>
        <button type="button" className="btn primary" onClick={() => setTemplateOpen(true)}>
          <Icon name="zap" size={16} /> Create &amp; run
        </button>
      </div>

      {notice && <Alert kind="success" onClose={() => setNotice('')}>{notice}</Alert>}
      {pageError && <Alert kind="error" onClose={() => setPageError('')}>{pageError}</Alert>}

      <section className="card">
        <form
          className="toolbar"
          onSubmit={(event) => {
            event.preventDefault()
            setPage(1)
            setSearch(searchInput.trim())
          }}
        >
          <div className="search">
            <Icon name="search" size={16} />
            <input
              placeholder="Search workflows…"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              aria-label="Search workflows"
            />
          </div>
          <select
            className="select"
            value={statusFilter}
            aria-label="Filter by status"
            onChange={(event) => {
              setStatusFilter(event.target.value as '' | WorkflowStatus)
              setPage(1)
            }}
          >
            <option value="">All status</option>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <button type="submit" className="btn">Search</button>
        </form>

        {loading ? (
          <Loader />
        ) : workflows.length === 0 ? (
          <EmptyState
            icon="workflow"
            title="No workflows found"
            text={search || statusFilter ? 'Try different filters.' : 'Create your first workflow to get started.'}
            action={
              !search && !statusFilter ? (
                <button type="button" className="btn primary" onClick={openCreate}>
                  <Icon name="plus" size={16} /> Create workflow
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {workflows.map((workflow) => {
                  const archived = workflow.status === 'ARCHIVED'
                  const busy = busyId === workflow._id

                  return (
                    <tr key={workflow._id}>
                      <td>
                        <Link
                          to={archived ? '#' : `/workflows/${workflow._id}/builder`}
                          className="cell-title"
                          style={{ color: 'inherit' }}
                          onClick={(event) => archived && event.preventDefault()}
                        >
                          {workflow.name}
                        </Link>
                      </td>
                      <td><div className="cell-sub">{workflow.description || '—'}</div></td>
                      <td><StatusBadge status={workflow.status} /></td>
                      <td className="muted nowrap">{formatDate(workflow.updatedAt)}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="btn sm success"
                            disabled={archived || busy}
                            onClick={() => void handleRun(workflow)}
                            title="Run workflow"
                          >
                            <Icon name="play" size={13} /> Run
                          </button>
                          <Link
                            to={`/workflows/${workflow._id}/builder`}
                            className="btn sm"
                            aria-disabled={archived}
                            style={archived ? { pointerEvents: 'none', opacity: 0.5 } : undefined}
                          >
                            <Icon name="workflow" size={14} /> Builder
                          </Link>
                          <button
                            type="button"
                            className="btn sm icon"
                            disabled={archived}
                            onClick={() => openEdit(workflow)}
                            aria-label={`Edit ${workflow.name}`}
                            title="Edit details"
                          >
                            <Icon name="edit" size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn sm icon danger"
                            disabled={archived || busy}
                            onClick={() => void handleArchive(workflow)}
                            aria-label={`Archive ${workflow.name}`}
                            title="Archive"
                          >
                            <Icon name="archive" size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && workflows.length > 0 && (
          <Pager page={page} totalPages={totalPages} total={total} noun="workflows" onChange={setPage} />
        )}
      </section>

      {formOpen && (
        <Modal
          title={editing ? 'Edit workflow' : 'Create workflow'}
          subtitle={editing ? undefined : 'Give it a name — you will design the graph in the builder next.'}
          onClose={() => !saving && setFormOpen(false)}
          footer={
            <>
              <button type="button" className="btn" onClick={() => setFormOpen(false)} disabled={saving}>
                Cancel
              </button>
              <button type="submit" form="workflow-form" className="btn primary" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Create & open builder'}
              </button>
            </>
          }
        >
          {formError && <Alert kind="error">{formError}</Alert>}
          <form id="workflow-form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="wf-name">Workflow name</label>
              <input
                id="wf-name"
                className="input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Customer onboarding"
                autoFocus
              />
            </div>
            <div className="field">
              <label htmlFor="wf-desc">Description</label>
              <textarea
                id="wf-desc"
                className="textarea"
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What does this workflow do?"
              />
            </div>
          </form>
        </Modal>
      )}

      {templateOpen && (
        <Modal
          title="Live Weather Alert"
          subtitle="Creates a real workflow, then runs it right away. No API keys needed."
          onClose={() => !creatingTemplate && setTemplateOpen(false)}
          footer={
            <>
              <button type="button" className="btn" onClick={() => setTemplateOpen(false)} disabled={creatingTemplate}>
                Cancel
              </button>
              <button type="submit" form="template-form" className="btn primary" disabled={creatingTemplate}>
                {creatingTemplate ? <span className="spinner light" /> : <Icon name="zap" size={16} />}
                {creatingTemplate ? 'Creating…' : 'Create & run'}
              </button>
            </>
          }
        >
          {templateError && <Alert kind="error">{templateError}</Alert>}
          <form id="template-form" onSubmit={handleCreateFromTemplate}>
            <div className="field-row">
              <div className="field">
                <label htmlFor="tpl-city">City</label>
                <input id="tpl-city" className="input" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="tpl-th">Heat threshold (°C)</label>
                <input
                  id="tpl-th"
                  className="input"
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                />
              </div>
            </div>
          </form>
          <ol className="small muted" style={{ margin: '0 0 10px', paddingLeft: 18, lineHeight: 1.8 }}>
            <li>Geocode the city (Open-Meteo)</li>
            <li>Fetch the live temperature for those coordinates</li>
            <li>POST a report that uses both results</li>
            <li>Condition: temperature ≥ threshold → heat alert, otherwise all clear</li>
          </ol>
        </Modal>
      )}
    </div>
  )
}
