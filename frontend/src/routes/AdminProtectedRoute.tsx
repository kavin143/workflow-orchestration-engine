
import { Navigate, Outlet } from 'react-router-dom'
import { useAdminAuth } from '../features/admin/AdminAuthContext'

export default function AdminProtectedRoute() {
  const { isAuthenticated } = useAdminAuth()

  return isAuthenticated
    ? <Outlet />
    : <Navigate to="/admin/login" replace />
}
