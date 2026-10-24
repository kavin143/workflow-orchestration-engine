
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
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
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      })

      const token =
        result.accessToken ??
        result.token ??
        result.data?.accessToken ??
        result.data?.token

      if (!token) {
        throw new Error('The login response did not contain an access token.')
      }

      // Preserve the existing authentication flow.
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
        <aside className="login-brand">
          <div className="brand-icon" aria-hidden="true">
            ◈
          </div>

          <h1>Zaalima</h1>
          <p className="brand-tagline">Build. Automate. Scale.</p>

          <div className="brand-divider" />

          <h2>Your workflows, simplified.</h2>
          <p className="brand-description">
            Design, automate, and manage your workflows from one powerful
            workspace.
          </p>

          <div className="brand-badge">
            <span aria-hidden="true">✓</span>
            Built for productive teams
          </div>
        </aside>

        <section className="login-content">
          <div className="login-heading">
            <span className="eyebrow">WELCOME BACK</span>
            <h2>Sign in to your account</h2>
            <p>Enter your details to access your workspace.</p>
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
                disabled={loading}
              />
            </div>

            <div className="form-field">
              <div className="password-label-row">
                <label htmlFor="password">Password</label>
                <Link to="/forgot-password" className="forgot-link">
                  Forgot password?
                </Link>
              </div>

              <div className="password-input-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  disabled={loading}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <label className="remember-row">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                disabled={loading}
              />
              <span>Remember me</span>
            </label>

            {error && (
              <p role="alert" className="login-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in to workspace'}
              {!loading && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <div className="login-footer">
            <p>
              Don&apos;t have an account?{' '}
              <Link to="/register">Create account</Link>
            </p>
          </div>

          <p className="security-note">
            Secure access to your workflow workspace
          </p>
        </section>
      </section>
    </main>
  )
}

