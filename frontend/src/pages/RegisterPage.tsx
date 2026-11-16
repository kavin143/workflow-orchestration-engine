import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest } from '../services/api/apiClient'
import AuthLayout from '../components/layout/AuthLayout'
import { Alert, Icon, PasswordInput } from '../components/ui'
import { getErrorMessage } from '../utils/format'

type RegisterForm = {
  tenantName: string
  firstName: string
  lastName: string
  email: string
  password: string
  gender: string
  dateOfBirth: string
}

const initialForm: RegisterForm = {
  tenantName: '',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  gender: '',
  dateOfBirth: '',
}

function passwordChecks(password: string) {
  return [
    { ok: password.length >= 12, label: '12+ characters' },
    { ok: /[a-z]/.test(password), label: 'lowercase letter' },
    { ok: /[A-Z]/.test(password), label: 'uppercase letter' },
    { ok: /[0-9]/.test(password), label: 'number' },
  ]
}

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterForm>(initialForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const checks = passwordChecks(form.password)

  function updateField(field: keyof RegisterForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (checks.some((check) => !check.ok)) {
      setError('Password must be at least 12 characters and include lowercase, uppercase, and a number.')
      return
    }

    setLoading(true)

    try {
      const result = await apiRequest<{ success: boolean; message?: string }>('/auth/register', {
        method: 'POST',
        token: null,
        body: JSON.stringify({
          tenantName: form.tenantName.trim(),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          password: form.password,
          ...(form.gender && { gender: form.gender }),
          ...(form.dateOfBirth && { dateOfBirth: form.dateOfBirth }),
        }),
      })

      if (!result.success) {
        throw new Error(result.message || 'Registration failed.')
      }

      navigate('/login', {
        replace: true,
        state: {
          registrationSuccess: 'Workspace created. You can now sign in.',
          registeredEmail: form.email.trim(),
        },
      })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Create your workspace in under a minute."
      tagline="Your organisation gets an isolated workspace with its own users, workflows and execution history."
      points={[
        { icon: 'building', text: 'Private tenant workspace' },
        { icon: 'sparkles', text: 'Start from a ready-made live workflow' },
        { icon: 'activity', text: 'Full execution history and logs' },
      ]}
    >
      <h2>Create your account</h2>
      <p className="sub">Register a workspace and its first user.</p>

      {error && <Alert kind="error">{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="tenantName">Workspace name</label>
          <input
            id="tenantName"
            className="input"
            placeholder="Acme Corp"
            value={form.tenantName}
            onChange={(e) => updateField('tenantName', e.target.value)}
            required
            minLength={2}
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="firstName">First name</label>
            <input
              id="firstName"
              className="input"
              value={form.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              required
              minLength={2}
            />
          </div>
          <div className="field">
            <label htmlFor="lastName">Last name</label>
            <input
              id="lastName"
              className="input"
              value={form.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="reg-email">Work email</label>
          <input
            id="reg-email"
            className="input"
            type="email"
            autoComplete="username"
            placeholder="you@company.com"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="reg-password">Password</label>
          <PasswordInput
            id="reg-password"
            value={form.password}
            onChange={(value) => updateField('password', value)}
            autoComplete="new-password"
          />
          <div className="legend" style={{ gap: 10 }}>
            {checks.map((check) => (
              <span key={check.label} style={{ color: check.ok ? 'var(--success)' : undefined }}>
                {check.ok ? '✓' : '○'} {check.label}
              </span>
            ))}
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="gender">Gender (optional)</label>
            <select
              id="gender"
              className="select"
              style={{ width: '100%' }}
              value={form.gender}
              onChange={(e) => updateField('gender', e.target.value)}
            >
              <option value="">Select…</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
              <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="dob">Date of birth (optional)</label>
            <input
              id="dob"
              className="input"
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              value={form.dateOfBirth}
              onChange={(e) => updateField('dateOfBirth', e.target.value)}
            />
          </div>
        </div>

        <button className="btn primary lg block" type="submit" disabled={loading}>
          {loading ? <span className="spinner light" /> : null}
          {loading ? 'Creating workspace…' : 'Create workspace'}
          {!loading && <Icon name="chevronRight" size={18} />}
        </button>
      </form>

      <p className="auth-foot">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  )
}
