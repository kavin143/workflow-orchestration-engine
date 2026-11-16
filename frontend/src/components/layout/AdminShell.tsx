import { Outlet, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../features/admin/AdminAuthContext'
import Sidebar, { type NavItem } from './Sidebar'

const NAV_ITEMS: NavItem[] = [
  { to: '/admin', label: 'Overview', icon: 'dashboard' },
  { to: '/admin/tenants', label: 'Tenants', icon: 'building' },
  { to: '/admin/users', label: 'Users', icon: 'users' },
  { to: '/admin/executions', label: 'Executions', icon: 'activity' },
]

export default function AdminShell() {
  const { logout } = useAdminAuth()
  const navigate = useNavigate()

  return (
    <div className="shell">
      <Sidebar
        items={NAV_ITEMS}
        subtitle="PLATFORM ADMIN"
        userLabel="Administrator"
        userSub="Platform operator"
        onLogout={() => {
          logout()
          navigate('/admin/login', { replace: true })
        }}
      />
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
