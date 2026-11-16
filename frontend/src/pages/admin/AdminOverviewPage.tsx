import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApiRequest } from '../../services/api/adminApiClient'
import { Alert, EmptyState, Icon, Loader, PageHeader, StatCard } from '../../components/ui'
import { CHART_COLORS, DailyBarChart, Donut, type DayCount } from '../../components/charts'
import { formatMs, getErrorMessage, timeAgo, type ApiResponse } from '../../utils/format'

type Overview = {
  tenants: { total: number; active: number; disabled: number }
  users: { total: number; active: number; disabled: number }
  workflows: { total: number; active: number }
  executions: {
    total: number
    pending: number
    running: number
    success: number
    failed: number
    successRate: number
    avgDurationMs: number
  }
  queue: { pending: number; processing: number }
  last7Days: DayCount[]
  topTenants: { tenantId: string; name: string; executions: number }[]
  recentFailures: {
    _id: string
    workflowName: string
    tenantName: string
    startedAt: string
    error: string
  }[]
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<Overview | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [updated, setUpdated] = useState<Date | null>(null)

  const load = useCallback(async () => {
    try {
      const response = await adminApiRequest<ApiResponse<Overview>>('admin/overview')
      setData(response.data)
      setUpdated(new Date())
      setError('')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    const timer = setInterval(() => void load(), 5000)
    return () => clearInterval(timer)
  }, [load])

  const maxTenantRuns = Math.max(1, ...(data?.topTenants.map((t) => t.executions) ?? [1]))
  const queueDepth = (data?.queue.pending ?? 0) + (data?.queue.processing ?? 0)

  return (
    <div className="page">
      <PageHeader
        title="Platform overview"
        subtitle="Live health of every tenant, user and workflow run."
        actions={
          <>
            {updated && (
              <span className="live">
                <i /> Live · {updated.toLocaleTimeString('en-GB')}
              </span>
            )}
            <button type="button" className="btn" onClick={() => void load()}>
              <Icon name="refresh" size={15} /> Refresh
            </button>
          </>
        }
      />

      {error && <Alert kind="error">{error}</Alert>}
      {loading && <Loader />}

      {data && (
        <>
          <div className="grid stats">
            <StatCard label="Tenants" value={data.tenants.total} sub={`${data.tenants.active} active · ${data.tenants.disabled} disabled`} icon="building" tone="primary" />
            <StatCard label="Users" value={data.users.total} sub={`${data.users.active} active · ${data.users.disabled} disabled`} icon="users" tone="violet" />
            <StatCard label="Workflows" value={data.workflows.total} sub={`${data.workflows.active} active`} icon="workflow" tone="info" />
            <StatCard label="Total executions" value={data.executions.total} sub={`avg ${formatMs(data.executions.avgDurationMs)}`} icon="activity" tone="muted" />
          </div>

          <div className="grid stats">
            <StatCard label="Success rate" value={`${data.executions.successRate}%`} sub={`${data.executions.success} succeeded`} icon="check" tone="success" />
            <StatCard label="Failed runs" value={data.executions.failed} sub="retries exhausted" icon="alert" tone="danger" />
            <StatCard label="Running now" value={data.executions.running + data.executions.pending} sub="in progress or queued" icon="zap" tone="info" />
            <StatCard
              label="Worker queue"
              value={queueDepth}
              sub={queueDepth === 0 ? 'idle · healthy' : `${data.queue.processing} processing · ${data.queue.pending} waiting`}
              icon="server"
              tone={queueDepth > 25 ? 'warning' : 'success'}
            />
          </div>

          <div className="grid two" style={{ marginBottom: 16 }}>
            <section className="card">
              <div className="card-head">
                <h2>Execution volume</h2>
                <small>Last 7 days · all tenants</small>
              </div>
              <div className="card-body">
                <DailyBarChart data={data.last7Days} />
              </div>
            </section>

            <section className="card">
              <div className="card-head">
                <h2>Outcome split</h2>
              </div>
              <div className="card-body">
                {data.executions.total === 0 ? (
                  <EmptyState icon="activity" title="No executions yet" />
                ) : (
                  <Donut
                    centerLabel="Success rate"
                    centerValue={`${data.executions.successRate}%`}
                    segments={[
                      { label: 'Success', value: data.executions.success, color: CHART_COLORS.success },
                      { label: 'Failed', value: data.executions.failed, color: CHART_COLORS.failed },
                      { label: 'Running', value: data.executions.running + data.executions.pending, color: CHART_COLORS.running },
                    ]}
                  />
                )}
              </div>
            </section>
          </div>

          <div className="grid equal">
            <section className="card">
              <div className="card-head">
                <h2>Most active tenants</h2>
                <Link to="/admin/tenants" className="small">All tenants →</Link>
              </div>
              {data.topTenants.length === 0 ? (
                <EmptyState icon="building" title="No activity yet" />
              ) : (
                <div className="list">
                  {data.topTenants.map((tenant, index) => (
                    <div className="list-item" key={tenant.tenantId}>
                      <span className="avatar" style={{ width: 30, height: 30, fontSize: 12 }}>{index + 1}</span>
                      <div className="grow">
                        <div className="row">
                          <span className="cell-title truncate">{tenant.name}</span>
                          <span className="spacer" />
                          <span className="small muted">{tenant.executions} runs</span>
                        </div>
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${(tenant.executions / maxTenantRuns) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="card">
              <div className="card-head">
                <h2>Recent failures</h2>
                <Link to="/admin/executions" className="small">All executions →</Link>
              </div>
              {data.recentFailures.length === 0 ? (
                <EmptyState icon="check" title="No failures" text="Everything is running smoothly." />
              ) : (
                <div className="list">
                  {data.recentFailures.map((failure) => (
                    <div className="list-item" key={failure._id}>
                      <div className="stat-icon tone-danger" style={{ width: 34, height: 34, borderRadius: 9 }}>
                        <Icon name="alert" size={16} />
                      </div>
                      <div className="grow">
                        <div className="cell-title truncate">{failure.workflowName}</div>
                        <div className="small muted truncate">
                          {failure.tenantName} · {failure.error}
                        </div>
                      </div>
                      <span className="small muted">{timeAgo(failure.startedAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  )
}
