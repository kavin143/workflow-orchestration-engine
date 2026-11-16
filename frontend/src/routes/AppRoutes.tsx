import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import AdminProtectedRoute from './AdminProtectedRoute'
import AppShell from '../components/layout/AppShell'
import AdminShell from '../components/layout/AdminShell'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import DashboardPage from '../pages/DashboardPage'
import WorkflowsPage from '../pages/WorkflowsPage'
import WorkflowBuilderPage from '../pages/WorkflowBuilderPage'
import ExecutionsPage from '../pages/ExecutionsPage'
import ExecutionViewPage from '../pages/ExecutionViewPage'
import AdminLoginPage from '../pages/admin/AdminLoginPage'
import AdminOverviewPage from '../pages/admin/AdminOverviewPage'
import AdminTenantsPage from '../pages/admin/AdminTenantsPage'
import AdminUsersPage from '../pages/admin/AdminUsersPage'
import AdminExecutionsPage from '../pages/admin/AdminExecutionsPage'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />

      <Route element={<ProtectedRoute />}>
        {/* The builder is full-screen, so it lives outside the sidebar shell. */}
        <Route path="/workflows/:id/builder" element={<WorkflowBuilderPage />} />

        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/workflows" element={<WorkflowsPage />} />
          <Route path="/executions" element={<ExecutionsPage />} />
          <Route path="/executions/:id" element={<ExecutionViewPage />} />
        </Route>
      </Route>

      <Route element={<AdminProtectedRoute />}>
        <Route element={<AdminShell />}>
          <Route path="/admin" element={<AdminOverviewPage />} />
          <Route path="/admin/tenants" element={<AdminTenantsPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/executions" element={<AdminExecutionsPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
