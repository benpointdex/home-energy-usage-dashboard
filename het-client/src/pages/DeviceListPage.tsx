import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useDevices } from '../hooks/useDevices'
import { useUsage } from '../hooks/useUsage'
import { Cpu, Plus, Search, Filter } from 'lucide-react'
import type { DeviceType } from '../types/device'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deviceApi } from '../api/device'
import { showToast } from '../components/common/Toast'
import './DeviceListPage.css'
import './LoginPage.css'

const DEVICE_ICONS: Record<string, string> = {
  THERMOSTAT: '🌡️', HEATER: '🔥', FRIDGE: '❄️', AC: '💨', WASHER: '🫧', OTHER: '⚡',
}

const DEVICE_TYPES: DeviceType[] = ['THERMOSTAT', 'HEATER', 'FRIDGE', 'AC', 'WASHER', 'OTHER']

export default function DeviceListPage() {
  const { userId } = useAuth()
  const { data: devices, isLoading } = useDevices(userId)
  const { data: usage } = useUsage(userId, 3)

  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<'energy' | 'name' | 'location'>('energy')

  const queryClient = useQueryClient()

  const { mutate: toggleDevice } = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'ON' | 'OFF' }) =>
      deviceApi.toggleStatus(id, status),
    onSuccess: (updated) => {
      queryClient.setQueryData(['device', updated.id], updated)
      queryClient.invalidateQueries({ queryKey: ['devices', userId] })
    },
    onError: () => {
      showToast('Failed to toggle device state', 'error')
    }
  })

  // Merge energy data from usage into devices
  const enrichedDevices = (devices ?? []).map(d => {
    const usageDevice = usage?.devices?.find(ud => ud.id === d.id)
    return { ...d, energyConsumed: usageDevice?.energyConsumed ?? d.energyConsumed ?? 0 }
  })

  // Filter
  let filtered = enrichedDevices.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) || d.location.toLowerCase().includes(search.toLowerCase())
  )
  if (filterType !== 'ALL') {
    filtered = filtered.filter(d => d.type === filterType)
  }

  // Sort
  filtered.sort((a, b) => {
    if (sortBy === 'energy') return (b.energyConsumed ?? 0) - (a.energyConsumed ?? 0)
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    return a.location.localeCompare(b.location)
  })

  return (
    <div className="device-list">
      <div className="device-list__header">
        <div>
          <h1 className="page-title">Devices</h1>
          <p className="page-subtitle">{enrichedDevices.length} device{enrichedDevices.length !== 1 ? 's' : ''} registered</p>
        </div>
        <Link to="/app/devices/new" className="btn-primary" id="add-device-btn">
          <Plus size={18} /> Add Device
        </Link>
      </div>

      {/* ── Toolbar ── */}
      <div className="device-list__toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search devices…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-box__input"
          />
        </div>
        <div className="toolbar-actions">
          <div className="filter-group">
            <Filter size={14} />
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="form-select toolbar-select">
              <option value="ALL">All Types</option>
              {DEVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as 'energy' | 'name' | 'location')} className="form-select toolbar-select">
            <option value="energy">Sort: Energy</option>
            <option value="name">Sort: Name</option>
            <option value="location">Sort: Location</option>
          </select>
        </div>
      </div>

      {/* ── Device Grid ── */}
      {isLoading ? (
        <div className="device-grid">
          {[1, 2, 3, 4].map(i => <div key={i} className="device-card device-card--skeleton"><div className="skeleton-pulse" /></div>)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="device-grid">
          {filtered.map(device => (
            <Link to={`/app/devices/${device.id}`} key={device.id} className="device-card" id={`device-${device.id}`} style={{ position: 'relative' }}>
              <div className="device-card__icon">{DEVICE_ICONS[device.type] || '⚡'}</div>
              <div className="device-card__body">
                <h3 className="device-card__name">{device.name}</h3>
                <span className="device-card__location">{device.location}</span>
                <span className="device-card__type-badge">{device.type}</span>
              </div>
              <div className="device-card__energy">
                <Cpu size={14} />
                <span>{(device.energyConsumed ?? 0).toFixed(2)} kWh</span>
              </div>
              <div 
                className="device-card__toggle-container" 
                onClick={(e) => e.stopPropagation()} 
                style={{ 
                  position: 'absolute', 
                  top: 12, 
                  right: 12, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 6,
                  zIndex: 2
                }}
              >
                <input
                  className="form-toggle"
                  type="checkbox"
                  checked={device.status === 'ON'}
                  onChange={(e) => toggleDevice({ id: device.id, status: e.target.checked ? 'ON' : 'OFF' })}
                  style={{ transform: 'scale(0.85)', margin: 0 }}
                />
                <span 
                  style={{ 
                    fontSize: 11, 
                    fontWeight: 600,
                    color: device.status === 'ON' ? '#4ADE80' : '#71717A'
                  }}
                >
                  {device.status === 'ON' ? 'Active' : 'Off'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state__icon"><Cpu size={40} /></div>
          <h2 className="empty-state__title">No devices yet</h2>
          <p className="empty-state__desc">Add your first device to start tracking energy consumption.</p>
          <Link to="/app/devices/new" className="btn-primary">
            <Plus size={18} /> Add Your First Device
          </Link>
        </div>
      )}
    </div>
  )
}
