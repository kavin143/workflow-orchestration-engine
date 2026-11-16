import { useState } from 'react'

export type DayCount = {
  date: string
  success: number
  failed: number
  running: number
}

export const CHART_COLORS = {
  success: '#10b981',
  failed: '#ef4444',
  running: '#6366f1',
}

function shortDay(date: string): string {
  const d = new Date(`${date}T00:00:00`)
  return d.toLocaleDateString('en-US', { weekday: 'short' })
}

/** Stacked bar chart for the last N days, with hover tooltips. */
export function DailyBarChart({ data }: { data: DayCount[] }) {
  const [hover, setHover] = useState<number | null>(null)

  const width = 640
  const height = 240
  const pad = { top: 16, right: 10, bottom: 28, left: 34 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom

  const totals = data.map((d) => d.success + d.failed + d.running)
  const rawMax = Math.max(1, ...totals)
  const step = rawMax <= 5 ? 1 : Math.ceil(rawMax / 4 / 5) * 5
  const max = Math.ceil(rawMax / step) * step
  const ticks: number[] = []
  for (let v = 0; v <= max; v += step) ticks.push(v)

  const slot = innerW / Math.max(data.length, 1)
  const barW = Math.min(38, slot * 0.55)

  return (
    <div className="chart" style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        role="img"
        aria-label="Executions per day, stacked by status"
      >
        {ticks.map((tick) => {
          const y = pad.top + innerH - (tick / max) * innerH
          return (
            <g key={tick}>
              <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="#e8ecf4" strokeDasharray={tick === 0 ? '0' : '3 4'} />
              <text x={pad.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#94a3b8">
                {tick}
              </text>
            </g>
          )
        })}

        {data.map((day, index) => {
          const x = pad.left + slot * index + (slot - barW) / 2
          let y = pad.top + innerH
          const segments: { key: keyof typeof CHART_COLORS; value: number }[] = [
            { key: 'success', value: day.success },
            { key: 'failed', value: day.failed },
            { key: 'running', value: day.running },
          ]

          return (
            <g
              key={day.date}
              onMouseEnter={() => setHover(index)}
              onMouseLeave={() => setHover(null)}
            >
              <rect x={pad.left + slot * index} y={pad.top} width={slot} height={innerH} fill="transparent" />
              {hover === index && (
                <rect x={pad.left + slot * index + 2} y={pad.top} width={slot - 4} height={innerH} rx="8" fill="#f1f3fb" />
              )}
              {segments.map((segment) => {
                const h = (segment.value / max) * innerH
                y -= h
                return h > 0 ? (
                  <rect key={segment.key} x={x} y={y} width={barW} height={h} rx="3" fill={CHART_COLORS[segment.key]} />
                ) : null
              })}
              <text x={x + barW / 2} y={height - 8} textAnchor="middle" fontSize="11.5" fill="#64748b">
                {shortDay(day.date)}
              </text>
            </g>
          )
        })}
      </svg>

      {hover !== null && data[hover] && (
        <div
          style={{
            position: 'absolute',
            top: 6,
            left: `${((pad.left + slot * hover + slot / 2) / width) * 100}%`,
            transform: 'translateX(-50%)',
            padding: '8px 12px',
            borderRadius: 10,
            background: '#0f172a',
            color: '#fff',
            fontSize: 12,
            lineHeight: 1.6,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 8px 20px rgba(15,23,42,.3)',
          }}
        >
          <strong>{data[hover]!.date}</strong>
          <div>Success: {data[hover]!.success}</div>
          <div>Failed: {data[hover]!.failed}</div>
          <div>Running: {data[hover]!.running}</div>
        </div>
      )}

      <div className="legend" style={{ marginTop: 6 }}>
        <span><i style={{ background: CHART_COLORS.success }} />Success</span>
        <span><i style={{ background: CHART_COLORS.failed }} />Failed</span>
        <span><i style={{ background: CHART_COLORS.running }} />Running / pending</span>
      </div>
    </div>
  )
}

/** Donut chart with a centre label. */
export function Donut({
  segments,
  centerLabel,
  centerValue,
}: {
  segments: { label: string; value: number; color: string }[]
  centerLabel: string
  centerValue: string | number
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  const radius = 62
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 170 170" width="190" height="190" role="img" aria-label={`${centerLabel}: ${centerValue}`}>
        <circle cx="85" cy="85" r={radius} fill="none" stroke="#eef1f6" strokeWidth="18" />
        {total > 0 &&
          segments.map((segment) => {
            const length = (segment.value / total) * circumference
            const circle = (
              <circle
                key={segment.label}
                cx="85"
                cy="85"
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth="18"
                strokeDasharray={`${Math.max(length - 2, 0)} ${circumference - Math.max(length - 2, 0)}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 85 85)"
              />
            )
            offset += length
            return circle
          })}
        <text x="85" y="84" textAnchor="middle" fontSize="28" fontWeight="700" fill="#0f172a">
          {centerValue}
        </text>
        <text x="85" y="104" textAnchor="middle" fontSize="11.5" fill="#64748b">
          {centerLabel}
        </text>
      </svg>
      <div className="legend">
        {segments.map((segment) => (
          <span key={segment.label}>
            <i style={{ background: segment.color }} />
            {segment.label} <strong style={{ color: '#0f172a' }}>{segment.value}</strong>
          </span>
        ))}
      </div>
    </div>
  )
}
