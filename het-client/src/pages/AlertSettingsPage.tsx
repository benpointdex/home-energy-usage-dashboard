import { useState, useEffect, type FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useUser, useUpdateUser } from '../hooks/useUser'
import { showToast } from '../components/common/Toast'
import { Bell } from 'lucide-react'
import './AlertSettingsPage.css'

export default function AlertSettingsPage() {
  const { userId } = useAuth()
  const { data: user, isLoading } = useUser(userId)
  const updateUser = useUpdateUser(userId!)

  const [alerting, setAlerting] = useState(false)
  const [threshold, setThreshold] = useState(150)

  // Sync state with fetched user data
  useEffect(() => {
    if (user) {
      setAlerting(user.alerting)
      setThreshold(user.energyAlertingThreshold ?? 150)
    }
  }, [user])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      await updateUser.mutateAsync({
        ...user,
        alerting,
        energyAlertingThreshold: threshold,
      })
      showToast('Alert settings updated successfully', 'success')
    } catch (err) {
      showToast('Failed to update alert settings', 'error')
    }
  }

  if (isLoading) {
    return (
      <div className="settings-page">
        <div className="settings-page__header">
          <h1 className="page-title">Alert Settings</h1>
          <p className="page-subtitle">Configure consumption thresholds and notifications</p>
        </div>
        <div className="settings-card skeleton-loading">
          <div className="skeleton-line" style={{ width: '40%', height: '24px', marginBottom: '20px' }}></div>
          <div className="skeleton-line" style={{ width: '100%', height: '50px', marginBottom: '15px' }}></div>
          <div className="skeleton-line" style={{ width: '100%', height: '50px', marginBottom: '15px' }}></div>
        </div>
      </div>
    )
  }

  return (
    <div className="settings-page">
      <div className="settings-page__header">
        <h1 className="page-title">Alert Settings</h1>
        <p className="page-subtitle">Configure consumption thresholds and notifications</p>
      </div>

      <div className="settings-container">
        <form onSubmit={handleSubmit} className="settings-form">
          <div className="settings-card">
            <div className="settings-card__header">
              <div className="settings-card__icon">
                <Bell size={20} />
              </div>
              <div>
                <h2 className="settings-card__title">Energy Spikes Alerting</h2>
                <p className="settings-card__desc">Get notified when your home usage spikes above your limit.</p>
              </div>
            </div>

            <hr className="settings-divider" />

            <div className="form-toggle-row">
              <div className="form-toggle-info">
                <span className="form-toggle-label">Enable Energy Alerts</span>
                <p className="form-helper">Send an email notification when threshold is crossed.</p>
              </div>
              <input
                type="checkbox"
                className="form-toggle"
                checked={alerting}
                onChange={e => setAlerting(e.target.checked)}
                id="alerting-toggle"
              />
            </div>

            {alerting && (
              <div className="form-group alert-threshold-group">
                <div className="threshold-labels">
                  <label htmlFor="threshold-slider" className="form-label">Hourly Limit Threshold</label>
                  <span className="threshold-value">{threshold} kWh/hour</span>
                </div>
                
                <div className="threshold-controls">
                  <input
                    type="range"
                    id="threshold-slider"
                    min="10"
                    max="1000"
                    step="10"
                    value={threshold}
                    onChange={e => setThreshold(Number(e.target.value))}
                    className="threshold-slider"
                  />
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={threshold}
                    onChange={e => setThreshold(Math.max(10, Math.min(1000, Number(e.target.value))))}
                    className="form-input threshold-number-input"
                  />
                </div>
                <p className="form-helper">
                  You'll be alerted when your hourly usage exceeds {threshold} kWh.
                </p>
              </div>
            )}

            <div className="form-group email-readonly-group">
              <label className="form-label">Alert Recipient Email</label>
              <input
                type="text"
                className="form-input form-input--readonly"
                value={user?.email || ''}
                readOnly
              />
              <p className="form-helper">
                Alerts are delivered to your account email. You can update this in your Profile Settings.
              </p>
            </div>
          </div>

          <div className="settings-actions">
            <button
              type="submit"
              className="btn btn--primary"
              disabled={updateUser.isPending}
            >
              {updateUser.isPending ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
