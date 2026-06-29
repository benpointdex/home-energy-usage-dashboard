import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { userApi } from '../api/user'
import { Zap } from 'lucide-react'
import type { RegistrationDto } from '../types/user'
import './LoginPage.css'  // shared auth styles

export default function RegisterPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState<RegistrationDto & { confirmPassword: string }>({
    name: '',
    surname: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    alerting: true,
    energyAlertingThreshold: 150,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'First name is required'
    if (!form.surname.trim()) errs.surname = 'Last name is required'
    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email format'
    if (!form.password) errs.password = 'Password is required'
    else if (form.password.length < 8) errs.password = 'Minimum 8 characters'
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match'
    if (form.energyAlertingThreshold <= 0) errs.threshold = 'Must be a positive number'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setGlobalError(null)
    if (!validate()) return

    setLoading(true)
    try {
      const { confirmPassword: _, ...dto } = form
      await userApi.register(dto)
      navigate('/login?registered=true')
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { status?: number } }
        if (axiosErr.response?.status === 409) {
          setErrors(prev => ({ ...prev, email: 'An account with this email already exists' }))
        } else {
          setGlobalError('Please check your input and try again.')
        }
      } else {
        setGlobalError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field: string, value: string | number | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  return (
    <div className="auth-page">
      <div className="auth-card" id="register-card" style={{ maxWidth: 520 }}>
        <div className="auth-card__header">
          <div className="auth-card__icon">
            <Zap size={24} color="#4ADE80" />
          </div>
          <h1 className="auth-card__title">Create your account</h1>
          <p className="auth-card__subtitle">Start tracking your home energy today</p>
        </div>

        {globalError && (
          <div className="auth-card__banner auth-card__banner--error">{globalError}</div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">First Name</label>
              <input
                className={`form-input ${errors.name ? 'form-input--error' : ''}`}
                id="reg-name"
                type="text"
                value={form.name}
                onChange={e => updateField('name', e.target.value)}
                placeholder="Jane"
                required
                autoFocus
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-surname">Last Name</label>
              <input
                className={`form-input ${errors.surname ? 'form-input--error' : ''}`}
                id="reg-surname"
                type="text"
                value={form.surname}
                onChange={e => updateField('surname', e.target.value)}
                placeholder="Doe"
                required
              />
              {errors.surname && <span className="form-error">{errors.surname}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email</label>
            <input
              className={`form-input ${errors.email ? 'form-input--error' : ''}`}
              id="reg-email"
              type="email"
              value={form.email}
              onChange={e => updateField('email', e.target.value)}
              placeholder="you@example.com"
              required
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">Password</label>
              <input
                className={`form-input ${errors.password ? 'form-input--error' : ''}`}
                id="reg-password"
                type="password"
                value={form.password}
                onChange={e => updateField('password', e.target.value)}
                placeholder="Min. 8 characters"
                required
              />
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
              <input
                className={`form-input ${errors.confirmPassword ? 'form-input--error' : ''}`}
                id="reg-confirm"
                type="password"
                value={form.confirmPassword}
                onChange={e => updateField('confirmPassword', e.target.value)}
                placeholder="••••••••"
                required
              />
              {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-address">Home Address <span style={{ opacity: 0.5 }}>(optional)</span></label>
            <input
              className="form-input"
              id="reg-address"
              type="text"
              value={form.address}
              onChange={e => updateField('address', e.target.value)}
              placeholder="100 Energy Way, Power City"
            />
          </div>

          <div className="form-toggle-row">
            <span className="form-toggle-label">Enable energy alerts</span>
            <input
              className="form-toggle"
              id="reg-alerting"
              type="checkbox"
              checked={form.alerting}
              onChange={e => updateField('alerting', e.target.checked)}
            />
          </div>

          {form.alerting && (
            <div className="form-group">
              <label className="form-label" htmlFor="reg-threshold">Alert Threshold (kWh/hour)</label>
              <input
                className={`form-input ${errors.threshold ? 'form-input--error' : ''}`}
                id="reg-threshold"
                type="number"
                value={form.energyAlertingThreshold}
                onChange={e => updateField('energyAlertingThreshold', Number(e.target.value))}
                min={1}
                step={1}
              />
              <span className="form-helper">You'll be alerted when your hourly usage exceeds this value</span>
              {errors.threshold && <span className="form-error">{errors.threshold}</span>}
            </div>
          )}

          <button className="auth-btn" id="register-submit" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="auth-card__footer">
          Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
