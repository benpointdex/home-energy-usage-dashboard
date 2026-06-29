import { useState, useEffect, type FormEvent } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useDevice, useUpdateDevice, useDeleteDevice } from '../hooks/useDevices'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { showToast } from '../components/common/Toast'
import type { DeviceType, DeviceFormInput } from '../types/device'
import './DeviceListPage.css'
import './LoginPage.css'

const DEVICE_TYPES: DeviceType[] = ['THERMOSTAT', 'HEATER', 'FRIDGE', 'AC', 'WASHER', 'OTHER']

export default function EditDevicePage() {
  const { deviceId } = useParams<{ deviceId: string }>()
  const id = Number(deviceId)
  const { userId } = useAuth()
  const navigate = useNavigate()

  const { data: device, isLoading } = useDevice(id)
  const updateDevice = useUpdateDevice(id, userId ?? 0)
  const deleteDevice = useDeleteDevice(userId ?? 0)

  const [form, setForm] = useState<DeviceFormInput>({ name: '', type: 'OTHER', location: '' })
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    if (device) {
      setForm({ name: device.name, type: device.type as DeviceType, location: device.location })
    }
  }, [device])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await updateDevice.mutateAsync(form)
      showToast('Device updated', 'success')
      navigate(`/app/devices/${id}`)
    } catch {
      showToast('Failed to update device', 'error')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteDevice.mutateAsync(id)
      showToast('Device deleted', 'success')
      navigate('/app/devices')
    } catch {
      showToast('Failed to delete device', 'error')
    }
  }

  if (isLoading) return <div className="device-list"><div className="skeleton-pulse" style={{ height: 200 }} /></div>

  return (
    <div className="device-list">
      <Link to={`/app/devices/${id}`} className="back-link"><ArrowLeft size={16} /> Back to device</Link>
      <h1 className="page-title" style={{ marginBottom: 24 }}>Edit Device</h1>

      <div className="dash-card" style={{ maxWidth: 520 }}>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="edit-name">Device Name</label>
            <input
              className="form-input" id="edit-name" type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="edit-type">Type</label>
            <select
              className="form-select" id="edit-type"
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value as DeviceType }))}
            >
              {DEVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="edit-location">Location</label>
            <input
              className="form-input" id="edit-location" type="text"
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="auth-btn" type="submit" disabled={updateDevice.isPending} style={{ flex: 1 }}>
              {updateDevice.isPending ? 'Saving…' : 'Save Changes'}
            </button>
            <button className="btn-danger" type="button" onClick={() => setShowDeleteModal(true)}>
              <Trash2 size={16} />
            </button>
          </div>
        </form>
      </div>

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal__title">Delete this device?</h3>
            <p className="modal__text">This action cannot be undone.</p>
            <div className="modal__actions">
              <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn-danger" onClick={handleDelete} disabled={deleteDevice.isPending}>
                {deleteDevice.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
