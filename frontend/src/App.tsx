
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './features/auth/AuthContext'
import { AdminAuthProvider } from './features/admin/AdminAuthContext'
import AppRoutes from './routes/AppRoutes'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AdminAuthProvider>
          <AppRoutes />
        </AdminAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
