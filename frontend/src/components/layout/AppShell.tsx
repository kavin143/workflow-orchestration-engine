import { Outlet } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext'
import Sidebar, { type NavItem } from './Sidebar'

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/workflows', label: 'Workflows', icon: 'workflow' },
  { to: '/executions', label: 'Executions', icon: 'activity' },
]

export default function AppShell() {
  const { logout } = useAuth()

  return (
    <div className="shell">
      <Sidebar
        items={NAV_ITEMS}
        subtitle="ORCHESTRATOR"
        userLabel="Workspace"
        userSub="Signed in"
        onLogout={logout}
      />
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
