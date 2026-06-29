import { useState, useEffect, type FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useUser, useUpdateUser } from '../hooks/useUser'
import { showToast } from '../components/common/Toast'
import { User, Info } from 'lucide-react'
import './ProfilePage.css'

export default function ProfilePage() {
  const { userId } = useAuth()
  const { data: user, isLoading } = useUser(userId)
  const updateUser = useUpdateUser(userId!)

  // Form states
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [billingRate, setBillingRate] = useState('8.0')



  // Sync state on fetch
  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setSurname(user.surname || '')
      setEmail(user.email || '')
      setAddress(user.address || '')
    }
    const savedRate = localStorage.getItem('energy_tracker_rate') || '8.0'
    setBillingRate(savedRate)
  }, [user])

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!name.trim() || !surname.trim() || !email.trim()) {
      showToast('First name, last name, and email are required', 'error')
      return
    }

    try {
      await updateUser.mutateAsync({
        ...user,
        name,
        surname,
        email,
        address: address.trim() || null,
      })
      localStorage.setItem('energy_tracker_rate', billingRate)
      showToast('Profile updated successfully', 'success')
    } catch (err) {
      showToast('Failed to update profile details', 'error')
    }
  }



  if (isLoading) {
    return (
      <div className="profile-page">
        <div className="profile-page__header">
          <h1 className="page-title">Profile Settings</h1>
          <p className="page-subtitle">Manage your personal information</p>
        </div>
        <div className="profile-card skeleton-loading">
          <div className="skeleton-line" style={{ width: '30%', height: '24px', marginBottom: '20px' }}></div>
          <div className="skeleton-line" style={{ width: '100%', height: '50px', marginBottom: '15px' }}></div>
          <div className="skeleton-line" style={{ width: '100%', height: '50px', marginBottom: '15px' }}></div>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-page">
      <div className="profile-page__header">
        <h1 className="page-title">Profile Settings</h1>
        <p className="page-subtitle">Manage your personal information</p>
      </div>

      <div className="profile-container">
        <form onSubmit={handleSave} className="profile-form">
          <div className="profile-card">
            <div className="profile-card__header">
              <div className="profile-card__icon">
                <User size={20} />
              </div>
              <div>
                <h2 className="profile-card__title">Personal Details</h2>
                <p className="profile-card__desc">Update your name, email address, and home details.</p>
              </div>
            </div>

            <hr className="profile-divider" />

            {/* Info Banner */}
            <div className="info-banner">
              <Info size={16} className="info-banner__icon" />
              <div className="info-banner__text">
                Changing your email address here updates your account profile, but your login password credentials remain managed by Keycloak.
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="first-name" className="form-label">First Name</label>
                <input
                  type="text"
                  id="first-name"
                  className="form-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="John"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="last-name" className="form-label">Last Name</label>
                <input
                  type="text"
                  id="last-name"
                  className="form-input"
                  value={surname}
                  onChange={e => setSurname(e.target.value)}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                type="email"
                id="email"
                className="form-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="john.doe@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="address" className="form-label">Home Address (Optional)</label>
              <textarea
                id="address"
                className="form-input form-textarea"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="123 Energy Lane, Green City"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="billing-rate" className="form-label">Electricity Billing Rate (₹/kWh)</label>
              <input
                type="number"
                id="billing-rate"
                className="form-input"
                value={billingRate}
                onChange={e => setBillingRate(e.target.value)}
                placeholder="8.0"
                min="0.1"
                step="0.1"
                required
              />
            </div>
          </div>

          <div className="profile-actions">
            <button
              type="submit"
              className="btn btn--primary"
              disabled={updateUser.isPending}
            >
              {updateUser.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
