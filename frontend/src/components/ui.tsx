import { useEffect, useState, type ReactNode } from 'react'

/* ---------- Icons (inline SVG, no dependency) ---------- */

const PATHS = {
  dashboard: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z',
  workflow: 'M5 3h4v4H5zM15 3h4v4h-4zM10 17h4v4h-4zM7 7v3a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7M12 12v5',
  play: 'M6 4l14 8-14 8z',
  activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
  users: 'M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM21 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  building: 'M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M2 21h20M8 7h4M8 11h4M8 15h4',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  plus: 'M12 5v14M5 12h14',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35',
  edit: 'M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z',
  trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6',
  archive: 'M21 8v13H3V8M1 3h22v5H1zM10 12h4',
  check: 'M20 6L9 17l-5-5',
  x: 'M18 6L6 18M6 6l12 12',
  alert: 'M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  refresh: 'M23 4v6h-6M1 20v-6h6M3.5 9a9 9 0 0 1 15-3.4L23 10M1 14l4.5 4.4A9 9 0 0 0 20.5 15',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  eyeOff: 'M17.9 17.9A10.1 10.1 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.1-5.9M9.9 4.2A9.1 9.1 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.2 3.2M1 1l22 22',
  globe: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20',
  branch: 'M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9a9 9 0 0 1-9 9',
  timer: 'M10 2h4M12 14l3-3M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
  flag: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7',
  save: 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  server: 'M2 4h20v6H2zM2 14h20v6H2zM6 7h.01M6 17h.01',
  zap: 'M13 2L3 14h9l-1 8 10-12h-9z',
  sparkles: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z',
  cloud: 'M18 10h-1.3A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z',
  chevronLeft: 'M15 18l-6-6 6-6',
  chevronRight: 'M9 18l6-6-6-6',
  arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
  layout: 'M3 3h18v18H3zM3 9h18M9 21V9',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
  ban: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM4.9 4.9l14.2 14.2',
} as const

export type IconName = keyof typeof PATHS

export function Icon({
  name,
  size = 18,
  stroke = 2,
}: {
  name: IconName
  size?: number
  stroke?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}

export function BrandMark({ size = 20 }: { size?: number }) {
  return (
    <span className="brand-mark">
      <Icon name="workflow" size={size} stroke={2.2} />
    </span>
  )
}

/* ---------- Status badge ---------- */

const BADGE_STYLE: Record<string, { cls: string; label: string; live?: boolean }> = {
  PENDING: { cls: 'b-muted', label: 'Pending' },
  RUNNING: { cls: 'b-info', label: 'Running', live: true },
  SUCCESS: { cls: 'b-success', label: 'Success' },
  FAILED: { cls: 'b-danger', label: 'Failed' },
  RETRYING: { cls: 'b-warning', label: 'Retrying', live: true },
  DEAD_LETTER: { cls: 'b-dark', label: 'Dead letter' },
  DRAFT: { cls: 'b-muted', label: 'Draft' },
  ACTIVE: { cls: 'b-success', label: 'Active' },
  ARCHIVED: { cls: 'b-warning', label: 'Archived' },
  DISABLED: { cls: 'b-danger', label: 'Disabled' },
}

export function StatusBadge({ status }: { status: string }) {
  const style = BADGE_STYLE[status] ?? { cls: 'b-muted', label: status }

  return (
    <span className={`badge ${style.cls} ${style.live ? 'pulse' : ''}`}>
      {style.label}
    </span>
  )
}

/* ---------- Layout bits ---------- */

export function PageHeader({
  title,
  subtitle,
  actions,
  crumbs,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  crumbs?: ReactNode
}) {
  return (
    <>
      {crumbs && <div className="crumbs">{crumbs}</div>}
      <div className="page-head">
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {actions && <div className="page-actions">{actions}</div>}
      </div>
    </>
  )
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = 'primary',
}: {
  label: string
  value: ReactNode
  sub?: string
  icon: IconName
  tone?: 'primary' | 'success' | 'danger' | 'info' | 'warning' | 'violet' | 'muted'
}) {
  return (
    <div className="stat">
      <div className={`stat-icon tone-${tone}`}>
        <Icon name={icon} size={22} />
      </div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  )
}

export function Loader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="center-state" role="status">
      <div className="spinner" />
      <span>{label}</span>
    </div>
  )
}

export function EmptyState({
  icon = 'layout',
  title,
  text,
  action,
}: {
  icon?: IconName
  title: string
  text?: string
  action?: ReactNode
}) {
  return (
    <div className="center-state">
      <div className="empty-icon">
        <Icon name={icon} size={26} />
      </div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  )
}

export function Alert({
  kind,
  children,
  onClose,
}: {
  kind: 'error' | 'success' | 'warn' | 'info'
  children: ReactNode
  onClose?: () => void
}) {
  return (
    <div className={`alert ${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      <Icon name={kind === 'success' ? 'check' : kind === 'info' ? 'info' : 'alert'} size={17} />
      <div>{children}</div>
      {onClose && (
        <button type="button" className="x" onClick={onClose} aria-label="Dismiss">
          <Icon name="x" size={15} />
        </button>
      )}
    </div>
  )
}

export function Pager({
  page,
  totalPages,
  total,
  onChange,
  noun = 'results',
}: {
  page: number
  totalPages: number
  total: number
  onChange: (page: number) => void
  noun?: string
}) {
  return (
    <div className="pager">
      <span>
        {total} {noun}
      </span>
      <div className="pager-btns">
        <button
          type="button"
          className="btn sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <Icon name="chevronLeft" size={15} /> Prev
        </button>
        <span>
          Page {page} of {Math.max(totalPages, 1)}
        </span>
        <button
          type="button"
          className="btn sm"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Next <Icon name="chevronRight" size={15} />
        </button>
      </div>
    </div>
  )
}

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
  width,
}: {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  width?: number
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} style={width ? { maxWidth: width } : undefined}>
        <div className="modal-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" className="btn icon ghost" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

export function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  placeholder,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  autoComplete?: string
  placeholder?: string
}) {
  const [show, setShow] = useToggle()

  return (
    <div className="pw">
      <input
        id={id}
        className="input"
        type={show ? 'text' : 'password'}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        required
      />
      <button type="button" onClick={setShow} aria-label={show ? 'Hide password' : 'Show password'}>
        <Icon name={show ? 'eyeOff' : 'eye'} size={17} />
      </button>
    </div>
  )
}


function useToggle(): [boolean, () => void] {
  const [value, setValue] = useState(false)
  return [value, () => setValue((current) => !current)]
}
