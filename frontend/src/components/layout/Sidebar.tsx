import { NavLink } from 'react-router-dom'
import { BrandMark, Icon, type IconName } from '../ui'

export type NavItem = { to: string; label: string; icon: IconName }

export default function Sidebar({
  items,
  subtitle,
  userLabel,
  userSub,
  onLogout,
}: {
  items: NavItem[]
  subtitle: string
  userLabel: string
  userSub: string
  onLogout: () => void
}) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <BrandMark />
        <div className="brand-text">
          <strong>Workflow</strong>
          <span>{subtitle}</span>
        </div>
      </div>

      <div className="nav-label">Menu</div>
      <nav className="nav" aria-label="Main">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/admin'}>
            <Icon name={item.icon} size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-foot">
        <div className="who">
          <div className="avatar">{userLabel.slice(0, 2).toUpperCase()}</div>
          <div>
            <strong>{userLabel}</strong>
            <small>{userSub}</small>
          </div>
        </div>
        <button type="button" className="logout" onClick={onLogout}>
          <Icon name="logout" size={18} />
          Log out
        </button>
      </div>
    </aside>
  )
}
