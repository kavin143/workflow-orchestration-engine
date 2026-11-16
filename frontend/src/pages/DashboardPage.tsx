import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../services/api/apiClient'
import { Alert, EmptyState, Icon, Loader, PageHeader, StatCard, StatusBadge } from '../components/ui'
import { CHART_COLORS, DailyBarChart, Donut, type DayCount } from '../components/charts'
import {
  formatDuration,
  getErrorMessage,
  timeAgo,
  type ApiResponse,
  type Paged,
} from '../utils/format'

type WorkflowSummary = { total: number; draft: number; active: number; archived: number }

type ExecutionSummary = {
  total: number
  pending: number
  running: number
  success: number
  failed: number
  last7Days: DayCount[]
}

type RecentExecution = {
  _id: string
  workflowName: string
  status: string
  startedAt: string
  finishedAt?: string
}

export default function DashboardPage() {
  const [workflows, setWorkflows] = useState<WorkflowSummary | null>(null)
  const [executions, setExecutions] = useState<ExecutionSummary | null>(null)
  const [recent, setRecent] = useState<RecentExecution[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [wf, ex, list] = await Promise.all([
        apiRequest<ApiResponse<WorkflowSummary>>('workflows/summary'),
        apiRequest<ApiResponse<ExecutionSummary>>('executions/summary'),
        apiRequest<ApiResponse<Paged<RecentExecution>>>('executions?limit=6'),
      ])

      setWorkflows(wf.data)
      setExecutions(ex.data)
      setRecent(list.data.items)
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

  const finished = executions ? executions.success + executions.failed : 0
  const successRate = executions && finished > 0 ? Math.round((executions.success / finished) * 100) : 0

  return (
    <div className="page">
      <PageHeader
        title="Dashboard"
        subtitle="Live overview of your workflows and executions."
        actions={
          <Link to="/workflows" className="btn primary">
            <Icon name="plus" size={16} /> New workflow
          </Link>
        }
      />

      {error && <Alert kind="error">{error}</Alert>}
      {loading && <Loader />}

      {!loading && workflows && executions && (
        <>
          <div className="grid stats">
            <StatCard label="Total workflows" value={workflows.total} sub={`${workflows.active} active · ${workflows.draft} draft`} icon="workflow" tone="primary" />
            <StatCard label="Running now" value={executions.running + executions.pending} sub="in progress or queued" icon="zap" tone="info" />
            <StatCard label="Successful runs" value={executions.success} sub={`${successRate}% success rate`} icon="check" tone="success" />
            <StatCard label="Failed runs" value={executions.failed} sub="retries exhausted" icon="alert" tone="danger" />
          </div>

          <div className="grid two" style={{ marginBottom: 16 }}>
            <section className="card">
              <div className="card-head">
                <h2>Execution overview</h2>
                <small>Last 7 days</small>
              </div>
              <div className="card-body">
                <DailyBarChart data={executions.last7Days} />
              </div>
            </section>

            <section className="card">
              <div className="card-head">
                <h2>Execution status</h2>
                <small>All time</small>
              </div>
              <div className="card-body">
                {executions.total === 0 ? (
                  <EmptyState icon="activity" title="No runs yet" text="Run a workflow to see results here." />
                ) : (
                  <Donut
                    centerLabel="Total runs"
                    centerValue={executions.total}
                    segments={[
                      { label: 'Success', value: executions.success, color: CHART_COLORS.success },
                      { label: 'Failed', value: executions.failed, color: CHART_COLORS.failed },
                      { label: 'Running', value: executions.running + executions.pending, color: CHART_COLORS.running },
                    ]}
                  />
                )}
              </div>
            </section>
          </div>

          <section className="card">
            <div className="card-head">
              <h2>Recent executions</h2>
              <Link to="/executions" className="small">View all →</Link>
            </div>

            {recent.length === 0 ? (
              <EmptyState
                icon="play"
                title="Nothing has run yet"
                text="Create a workflow from the live weather template and run it in one click."
                action={<Link to="/workflows" className="btn primary">Go to workflows</Link>}
              />
            ) : (
              <div className="list">
                {recent.map((item) => (
                  <Link
                    key={item._id}
                    to={`/executions/${item._id}`}
                    className="list-item"
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    <div className="grow">
                      <div className="cell-title truncate">{item.workflowName}</div>
                      <div className="small muted">
                        {timeAgo(item.startedAt)} · {formatDuration(item.startedAt, item.finishedAt)}
                      </div>
                    </div>
                    <StatusBadge status={item.status} />
                    <Icon name="chevronRight" size={16} />
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
