import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest } from '../services/api/apiClient'

type RegisterResponse = {
  success: boolean
  message: string
  data?: {
    tenant: {
      id: string
      name: string
      slug: string
    }
    user: {
      id: string
      firstName: string
      lastName: string
      email: string
      tenantId: string
    }
  }
}

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

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterForm>(initialForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  function updateField(field: keyof RegisterForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (
      form.password.length < 12 ||
      !/[a-z]/.test(form.password) ||
      !/[A-Z]/.test(form.password) ||
      !/[0-9]/.test(form.password)
    ) {
      setError(
        'Password must be at least 12 characters and include lowercase, uppercase, and a number.',
      )
      return
    }

    setLoading(true)

    try {
      const payload = {
        tenantName: form.tenantName.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        ...(form.gender && { gender: form.gender }),
        ...(form.dateOfBirth && { dateOfBirth: form.dateOfBirth }),
      }

      const result = await apiRequest<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (!result.success) {
        throw new Error(result.message || 'Registration failed.')
      }

      setSuccess('Your workspace has been created successfully.')

      navigate('/login', {
        replace: true,
        state: {
          registrationSuccess:
            'Registration successful. You can now sign in.',
          registeredEmail: form.email.trim(),
        },
      })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Registration failed.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="register-page">
      <form className="register-card" onSubmit={handleSubmit}>
        <h1>Create your Zaalima workspace</h1>
        <p>
          Register your workspace and create your administrator account.
        </p>

        <label htmlFor="tenantName">Workspace name</label>
        <input
          id="tenantName"
          name="tenantName"
          type="text"
          autoComplete="organization"
          minLength={2}
          maxLength={100}
          value={form.tenantName}
          onChange={(event) =>
            updateField('tenantName', event.target.value)
          }
          required
        />

        <div className="register-name-row">
          <div className="register-name-field">
            <label htmlFor="firstName">First name</label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              minLength={2}
              maxLength={50}
              value={form.firstName}
              onChange={(event) =>
                updateField('firstName', event.target.value)
              }
              required
            />
          </div>

          <div className="register-name-field">
            <label htmlFor="lastName">Last name</label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              minLength={1}
              maxLength={50}
              value={form.lastName}
              onChange={(event) =>
                updateField('lastName', event.target.value)
              }
              required
            />
          </div>
        </div>

        <label htmlFor="registerEmail">Email</label>
        <input
          id="registerEmail"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          value={form.email}
          onChange={(event) =>
            updateField('email', event.target.value)
          }
          required
        />

        <label htmlFor="registerPassword">Password</label>
        <input
          id="registerPassword"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          value={form.password}
          onChange={(event) =>
            updateField('password', event.target.value)
          }
          aria-describedby="passwordHelp"
          required
        />

        <small id="passwordHelp">
          At least 12 characters, including an uppercase letter, a lowercase
          letter, and a number.
        </small>

        <label htmlFor="gender">Gender (optional)</label>
        <select
          id="gender"
          name="gender"
          value={form.gender}
          onChange={(event) => updateField('gender', event.target.value)}
        >
          <option value="">Prefer not to specify</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
          <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
        </select>

        <label htmlFor="dateOfBirth">Date of birth (optional)</label>
        <input
          id="dateOfBirth"
          name="dateOfBirth"
          type="date"
          max={new Date().toISOString().slice(0, 10)}
          value={form.dateOfBirth}
          onChange={(event) =>
            updateField('dateOfBirth', event.target.value)
          }
        />

        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}

        {success && <p role="status">{success}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Creating workspace...' : 'Create workspace'}
        </button>

        <p>
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </main>
  )
}