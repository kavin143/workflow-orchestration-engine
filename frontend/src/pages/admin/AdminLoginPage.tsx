
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../features/admin/AdminAuthContext'
import { apiRequest } from '../../services/api/apiClient'

type AdminLoginResponse = {
  success?: boolean
  data?: {
    accessToken?: string
  }
}

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAdminAuth()
  const navigate = useNavigate()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await apiRequest<AdminLoginResponse>('admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        token: null,
      })

      const token = result.data?.accessToken

      if (!token) {
        throw new Error('The login response did not contain an access token.')
      }

      login(token)
      navigate('/admin/users', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page">
      <form className="panel login-panel" onSubmit={handleSubmit}>
        <h1>Admin Panel</h1>
        <p>Sign in with your platform administrator account.</p>

        <label htmlFor="admin-email">Email</label>
        <input
          id="admin-email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label htmlFor="admin-password">Password</label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        {error && <p role="alert" className="error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}
