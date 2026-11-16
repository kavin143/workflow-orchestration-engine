import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { apiRequest } from '../services/api/apiClient'
import AuthLayout from '../components/layout/AuthLayout'
import { Alert, Icon, PasswordInput } from '../components/ui'
import { getErrorMessage } from '../utils/format'

type LoginResponse = {
  token?: string
  accessToken?: string
  data?: { token?: string; accessToken?: string }
}

type LocationState = { registrationSuccess?: string; registeredEmail?: string } | null

export default function LoginPage() {
  const location = useLocation()
  const state = location.state as LocationState

  const [email, setEmail] = useState(state?.registeredEmail ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        token: null,
      })

      const token =
        result.accessToken ?? result.token ?? result.data?.accessToken ?? result.data?.token

      if (!token) {
        throw new Error('The login response did not contain an access token.')
      }

      login(token)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Automate anything with visual workflows."
      tagline="Design a workflow on a canvas, run it on a distributed worker, and watch every step execute in real time."
      points={[
        { icon: 'workflow', text: 'Drag-and-drop visual workflow builder' },
        { icon: 'zap', text: 'Real HTTP calls, branching and delays' },
        { icon: 'refresh', text: 'Automatic retries with dead-letter handling' },
        { icon: 'shield', text: 'Isolated, multi-tenant workspaces' },
      ]}
    >
      <h2>Welcome back</h2>
      <p className="sub">Sign in to your workspace to continue.</p>

      {state?.registrationSuccess && <Alert kind="success">{state.registrationSuccess}</Alert>}
      {error && <Alert kind="error">{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            className="input"
            type="email"
            placeholder="you@company.com"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <PasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            placeholder="Enter your password"
          />
        </div>

        <button className="btn primary lg block" type="submit" disabled={loading}>
          {loading ? <span className="spinner light" /> : null}
          {loading ? 'Signing in…' : 'Sign in'}
          {!loading && <Icon name="chevronRight" size={18} />}
        </button>
      </form>

      <p className="auth-foot">
        New here? <Link to="/register">Create a workspace</Link>
      </p>
      <p className="auth-foot small">
        <Link to="/admin/login">Platform administrator sign-in →</Link>
      </p>
    </AuthLayout>
  )
}
