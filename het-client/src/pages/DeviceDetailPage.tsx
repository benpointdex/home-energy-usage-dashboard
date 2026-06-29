import { useParams, useNavigate, Link } from 'react-router-dom'
import { useDevice, useDeleteDevice } from '../hooks/useDevices'
import { useAuth } from '../hooks/useAuth'
import { useUsage } from '../hooks/useUsage'
import { useState, useMemo } from 'react'
import { ArrowLeft, Edit, Trash2, Zap, MapPin } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { showToast } from '../components/common/Toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deviceApi } from '../api/device'
import './DeviceListPage.css'
import './LoginPage.css'

const DEVICE_ICONS: Record<string, string> = {
  THERMOSTAT: '🌡️', HEATER: '🔥', FRIDGE: '❄️', AC: '💨', WASHER: '🫧', OTHER: '⚡',
}

export default function DeviceDetailPage() {
  const { deviceId } = useParams<{ deviceId: string }>()
  const id = Number(deviceId)
  const { userId } = useAuth()
  const navigate = useNavigate()

  const { data: device, isLoading } = useDevice(id)
  const { data: usage } = useUsage(userId, 7)
  const deleteDevice = useDeleteDevice(userId ?? 0)
  const queryClient = useQueryClient()

  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const { mutate: toggleDevice, isPending: togglePending } = useMutation({
    mutationFn: (newStatus: 'ON' | 'OFF') =>
      deviceApi.toggleStatus(id, newStatus),
    onSuccess: (updated) => {
      queryClient.setQueryData(['device', id], updated)
      queryClient.invalidateQueries({ queryKey: ['devices', userId] })
    },
    onError: () => {
      showToast('Failed to toggle device state', 'error')
    }
  })

  const deviceUsage = usage?.devices?.find(d => d.id === id)
  const energyConsumed = deviceUsage?.energyConsumed ?? 0

  const chartData = useMemo(() => {
    const dataPoints = []
    const now = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(now.getDate() - i)
      const label = date.toLocaleDateString(undefined, { weekday: 'short' })

      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateKey = `${year}-${month}-${day}`

      const dailyKwh = deviceUsage?.dailyUsage?.[dateKey] ?? 0

      dataPoints.push({ name: label, kWh: Number(dailyKwh.toFixed(2)) })
    }

    return dataPoints
  }, [deviceUsage])

  const handleDelete = async () => {
    try {
      await deleteDevice.mutateAsync(id)
      showToast('Device deleted', 'success')
      navigate('/app/devices')
    } catch {
      showToast('Failed to delete device', 'error')
    }
  }

  if (isLoading) {
    return <div className="device-list"><div className="skeleton-pulse" style={{ height: 200 }} /></div>
  }

  if (!device) {
    return (
      <div className="empty-state">
        <h2 className="empty-state__title">Device not found</h2>
        <Link to="/app/devices" className="btn-secondary"><ArrowLeft size={16} /> Back to devices</Link>
      </div>
    )
  }

  return (
    <div className="device-list">
      <Link to="/app/devices" className="back-link"><ArrowLeft size={16} /> Back to devices</Link>

      <div className="device-detail__header">
        <div className="device-detail__info">
          <span className="device-detail__icon">{DEVICE_ICONS[device.type] || '⚡'}</span>
          <div>
            <h1 className="page-title">{device.name}</h1>
            <div className="device-detail__meta" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <span className="device-card__type-badge" style={{ margin: 0 }}>{device.type}</span>
              <span className="device-detail__location" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> {device.location}</span>
              <div className="form-toggle-row" style={{ display: 'inline-flex', alignItems: 'center', border: 'none', padding: 0, margin: 0, gap: 8 }}>
                <input
                  className="form-toggle"
                  type="checkbox"
                  checked={device.status === 'ON'}
                  disabled={togglePending}
                  onChange={(e) => toggleDevice(e.target.checked ? 'ON' : 'OFF')}
                />
                <span className="form-toggle-label" style={{ margin: 0, fontSize: 13, color: device.status === 'ON' ? '#4ADE80' : '#A1A1AA' }}>
                  {device.status === 'ON' ? 'Active' : 'Off'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="device-detail__actions">
          <Link to={`/app/devices/${id}/edit`} className="btn-secondary"><Edit size={16} /> Edit</Link>
          <button className="btn-danger" onClick={() => setShowDeleteModal(true)}><Trash2 size={16} /> Delete</button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginTop: 24 }}>
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--green"><Zap size={20} /></div>
          <div className="stat-card__body">
            <span className="stat-card__label">Total (7 days)</span>
            <span className="stat-card__value">{energyConsumed.toFixed(2)} kWh</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--blue"><Zap size={20} /></div>
          <div className="stat-card__body">
            <span className="stat-card__label">Avg/day</span>
            <span className="stat-card__value">{(energyConsumed / 7).toFixed(2)} kWh</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="dash-card" style={{ marginTop: 24 }}>
        <h2 className="dash-card__title">Usage (Last 7 Days)</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" stroke="#71717A" fontSize={12} />
            <YAxis stroke="#71717A" fontSize={12} />
            <Tooltip contentStyle={{ background: '#18181B', border: '1px solid #27272A', borderRadius: 8, color: '#fff' }} />
            <Bar dataKey="kWh" fill="#4ADE80" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal__title">Delete "{device.name}"?</h3>
            <p className="modal__text">This action cannot be undone. All data associated with this device will be permanently removed.</p>
            <div className="modal__actions">
              <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn-danger" onClick={handleDelete} disabled={deleteDevice.isPending}>
                {deleteDevice.isPending ? 'Deleting…' : 'Delete Device'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
