import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCreateDevice } from '../hooks/useDevices'
import { ArrowLeft } from 'lucide-react'
import { showToast } from '../components/common/Toast'
import type { DeviceType, DeviceFormInput } from '../types/device'
import './DeviceListPage.css'
import './LoginPage.css'

const DEVICE_TYPES: DeviceType[] = ['THERMOSTAT', 'HEATER', 'FRIDGE', 'AC', 'WASHER', 'OTHER']

export default function AddDevicePage() {
  const { userId } = useAuth()
  const navigate = useNavigate()
  const createDevice = useCreateDevice(userId ?? 0)

  const [form, setForm] = useState<DeviceFormInput>({
    name: '',
    type: 'OTHER',
    location: '',
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await createDevice.mutateAsync(form)
      showToast('Device added successfully', 'success')
      navigate('/app/devices')
    } catch {
      showToast('Failed to add device', 'error')
    }
  }

  return (
    <div className="device-list">
      <Link to="/app/devices" className="back-link"><ArrowLeft size={16} /> Back to devices</Link>
      <h1 className="page-title" style={{ marginBottom: 24 }}>Add New Device</h1>

      <div className="dash-card" style={{ maxWidth: 520 }}>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="device-name">Device Name</label>
            <input
              className="form-input"
              id="device-name"
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Smart Thermostat"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="device-type">Type</label>
            <select
              className="form-select"
              id="device-type"
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value as DeviceType }))}
            >
              {DEVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="device-location">Location</label>
            <input
              className="form-input"
              id="device-location"
              type="text"
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              placeholder="Living Room"
              required
            />
          </div>
          <button className="auth-btn" type="submit" disabled={createDevice.isPending}>
            {createDevice.isPending ? 'Adding…' : 'Add Device'}
          </button>
        </form>
      </div>
    </div>
  )
}
