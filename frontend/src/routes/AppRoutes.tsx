import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import AdminProtectedRoute from './AdminProtectedRoute'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import DashboardPage from '../pages/DashboardPage'
import WorkflowsPage from '../pages/WorkflowsPage'
import ExecutionsPage from '../pages/ExecutionsPage'
import AdminLoginPage from '../pages/admin/AdminLoginPage'
import AdminUsersPage from '../pages/admin/AdminUsersPage'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/workflows" element={<WorkflowsPage />} />
        <Route path="/executions" element={<ExecutionsPage />} />
      </Route>

      <Route element={<AdminProtectedRoute />}>
        <Route path="/admin/users" element={<AdminUsersPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}