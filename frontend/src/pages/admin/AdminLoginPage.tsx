import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../features/admin/AdminAuthContext'
import { apiRequest } from '../../services/api/apiClient'
import AuthLayout from '../../components/layout/AuthLayout'
import { Alert, Icon, PasswordInput } from '../../components/ui'
import { getErrorMessage } from '../../utils/format'

type AdminLoginResponse = { data?: { accessToken?: string } }

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
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      admin
      title="Platform control centre."
      tagline="Monitor every tenant, user and execution across the platform, and act on problems instantly."
      points={[
        { icon: 'activity', text: 'Live platform-wide execution monitoring' },
        { icon: 'building', text: 'Tenant and user management' },
        { icon: 'server', text: 'Worker queue health at a glance' },
      ]}
    >
      <h2>Admin sign-in</h2>
      <p className="sub">Restricted to platform administrators.</p>

      {error && <Alert kind="error">{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="admin-email">Email</label>
          <input
            id="admin-email"
            className="input"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="admin-password">Password</label>
          <PasswordInput
            id="admin-password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />
        </div>

        <button className="btn primary lg block" type="submit" disabled={loading}>
          {loading ? <span className="spinner light" /> : null}
          {loading ? 'Signing in…' : 'Sign in'}
          {!loading && <Icon name="chevronRight" size={18} />}
        </button>
      </form>

      <p className="auth-foot small">
        <Link to="/login">← Back to workspace sign-in</Link>
      </p>
    </AuthLayout>
  )
}
