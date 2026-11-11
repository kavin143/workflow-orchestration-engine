
import { useEffect, useState, type ReactNode } from 'react'
import { apiRequest } from '../services/api/apiClient'

type WorkflowSummary = {
  total: number
  draft: number
  active: number
  archived: number
}

type DailyExecutionCount = {
  date: string
  success: number
  failed: number
  running: number
}

type ExecutionSummary = {
  total: number
  pending: number
  running: number
  success: number
  failed: number
  last7Days: DailyExecutionCount[]
}

type ApiResponse<T> = { success: boolean; data: T }

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.'
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="card" style={{ minWidth: 150 }}>
      <div className="card-body">
        <div className="text-muted small">{label}</div>
        <div className="fs-3 fw-semibold" style={color ? { color } : undefined}>
          {value}
        </div>
      </div>
    </div>
  )
}

function WeeklyChart({ data }: { data: DailyExecutionCount[] }) {
  const maxValue = Math.max(1, ...data.map((day) => day.success + day.failed + day.running))
  const barWidth = 36
  const gap = 16
  const chartHeight = 140
  const width = data.length * (barWidth + gap)

  return (
    <svg width={width} height={chartHeight + 30} role="img" aria-label="Executions over the last 7 days">
      {data.map((day, index) => {
        const x = index * (barWidth + gap)
        const successHeight = (day.success / maxValue) * chartHeight
        const failedHeight = (day.failed / maxValue) * chartHeight
        const runningHeight = (day.running / maxValue) * chartHeight
        let y = chartHeight

        const bars: ReactNode[] = []

        y -= successHeight
        bars.push(<rect key="success" x={x} y={y} width={barWidth} height={successHeight} fill="#198754" />)

        y -= failedHeight
        bars.push(<rect key="failed" x={x} y={y} width={barWidth} height={failedHeight} fill="#dc3545" />)

        y -= runningHeight
        bars.push(<rect key="running" x={x} y={y} width={barWidth} height={runningHeight} fill="#0d6efd" />)

        return (
          <g key={day.date}>
            {bars}
            <text x={x + barWidth / 2} y={chartHeight + 18} textAnchor="middle" fontSize={11} fill="#6c757d">
              {day.date.slice(5)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default function DashboardPage() {
  const [workflowSummary, setWorkflowSummary] = useState<WorkflowSummary | null>(null)
  const [executionSummary, setExecutionSummary] = useState<ExecutionSummary | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')

      try {
        const [workflows, executions] = await Promise.all([
          apiRequest<ApiResponse<WorkflowSummary>>('workflows/summary'),
          apiRequest<ApiResponse<ExecutionSummary>>('executions/summary'),
        ])

        setWorkflowSummary(workflows.data)
        setExecutionSummary(executions.data)
      } catch (err) {
        setError(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  return (
    <div>
      <h1>Dashboard</h1>
      <p className="text-muted">Welcome to the Zaalima Workflow Orchestration Engine.</p>

      {error && <div className="alert alert-danger">{error}</div>}
      {loading && <p>Loading…</p>}

      {!loading && workflowSummary && (
        <>
          <h2 className="h6 mt-4">Workflows</h2>
          <div className="d-flex gap-3 flex-wrap mb-4">
            <StatCard label="Total" value={workflowSummary.total} />
            <StatCard label="Active" value={workflowSummary.active} color="#198754" />
            <StatCard label="Draft" value={workflowSummary.draft} color="#6c757d" />
            <StatCard label="Archived" value={workflowSummary.archived} color="#6c757d" />
          </div>
        </>
      )}

      {!loading && executionSummary && (
        <>
          <h2 className="h6">Executions</h2>
          <div className="d-flex gap-3 flex-wrap mb-4">
            <StatCard label="Total" value={executionSummary.total} />
            <StatCard label="Running" value={executionSummary.running + executionSummary.pending} color="#0d6efd" />
            <StatCard label="Success" value={executionSummary.success} color="#198754" />
            <StatCard label="Failed" value={executionSummary.failed} color="#dc3545" />
          </div>

          <h2 className="h6">Last 7 days</h2>
          <div className="d-flex gap-3 align-items-center flex-wrap">
            <WeeklyChart data={executionSummary.last7Days} />
            <div className="small">
              <div><span style={{ color: '#198754' }}>■</span> Success</div>
              <div><span style={{ color: '#dc3545' }}>■</span> Failed</div>
              <div><span style={{ color: '#0d6efd' }}>■</span> Running/Pending</div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
