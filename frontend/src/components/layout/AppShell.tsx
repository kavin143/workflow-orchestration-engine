
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/workflows', label: 'Workflows' },
  { to: '/executions', label: 'Executions' },
]

export default function AppShell() {
  const { logout } = useAuth()

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      <nav
        className="d-flex flex-column flex-shrink-0 p-3 text-white"
        style={{ width: 220, background: '#1f2430' }}
      >
        <span className="fs-5 fw-semibold mb-4">Workflow Orchestrator</span>

        <ul className="nav nav-pills flex-column mb-auto">
          {NAV_ITEMS.map((item) => (
            <li className="nav-item" key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `nav-link text-white mb-1 ${isActive ? 'active bg-primary' : ''}`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <button type="button" className="btn btn-outline-light btn-sm mt-4" onClick={logout}>
          Log out
        </button>
      </nav>

      <main className="flex-grow-1 p-4" style={{ background: '#f5f7fb' }}>
        <Outlet />
      </main>
    </div>
  )
}
