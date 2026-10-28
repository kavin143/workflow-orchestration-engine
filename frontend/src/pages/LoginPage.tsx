import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { apiRequest } from '../services/api/apiClient'

type LoginResponse = {
  success?: boolean
  token?: string
  accessToken?: string
  data?: {
    token?: string
    accessToken?: string
  }
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
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
      })

      const token =
        result.accessToken ??
        result.token ??
        result.data?.accessToken ??
        result.data?.token

      if (!token) {
        throw new Error('The login response did not contain an access token.')
      }

      login(token)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
  <main className="login-page">
    <section className="login-card">
      <div className="login-brand">
        <div className="brand-icon">✦</div>

        <h1>Zaalima</h1>
        <p className="brand-tagline">
          Workflow orchestration made simple.
        </p>

        <div className="brand-divider" />

        <h2>Welcome back!</h2>
        <p className="brand-description">
          Sign in to manage your workflows, monitor executions,
          and keep your workspace organized.
        </p>

        <div className="brand-badge">
          <span>✓</span>
          Secure workspace access
        </div>
      </div>

      <div className="login-content">
        <div className="login-heading">
          <span className="eyebrow">WELCOME BACK</span>
          <h2>Sign in to Zaalima</h2>
          <p>Enter your account details to continue.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {error && (
            <p role="alert" className="login-error">
              {error}
            </p>
          )}

          <button
            className="login-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
            <span aria-hidden="true">→</span>
          </button>
        </form>

        <p className="login-footer">
          Don't have an account?{' '}
          <a href="/register">Create an account</a>
        </p>

        <p className="security-note">
          Your workspace access is protected.
        </p>
      </div>
    </section>
  </main>
  )
}