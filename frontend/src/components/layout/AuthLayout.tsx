import type { ReactNode } from 'react'
import { BrandMark, Icon, type IconName } from '../ui'

export default function AuthLayout({
  admin = false,
  title,
  tagline,
  points,
  children,
}: {
  admin?: boolean
  title: string
  tagline: string
  points: { icon: IconName; text: string }[]
  children: ReactNode
}) {
  return (
    <div className="auth">
      <section className={`auth-hero ${admin ? 'admin' : ''}`}>
        <div className="brand" style={{ padding: 0 }}>
          <BrandMark />
          <div className="brand-text">
            <strong>Workflow Orchestrator</strong>
            <span>{admin ? 'PLATFORM ADMIN' : 'BUILD · AUTOMATE · SCALE'}</span>
          </div>
        </div>

        <h1>{title}</h1>
        <p>{tagline}</p>

        <ul className="hero-points">
          {points.map((point) => (
            <li key={point.text}>
              <span>
                <Icon name={point.icon} size={16} />
              </span>
              {point.text}
            </li>
          ))}
        </ul>

        {!admin && (
          <div className="mini-flow" aria-hidden="true">
            <span className="mini-node">Start</span>
            <span className="mini-arrow" />
            <span className="mini-node">API request</span>
            <span className="mini-arrow" />
            <span className="mini-node">Condition</span>
            <span className="mini-arrow" />
            <span className="mini-node">End</span>
          </div>
        )}
      </section>

      <section className="auth-form-side">
        <div className="auth-card">{children}</div>
      </section>
    </div>
  )
}
