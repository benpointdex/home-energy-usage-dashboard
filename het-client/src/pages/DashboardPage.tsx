import { useMemo, useState, useEffect } from 'react'
import './DashboardPage.css'
import { useAuth } from '../hooks/useAuth'
import { useUsage } from '../hooks/useUsage'
import { useAlerts } from '../hooks/useAlerts'
import { useUser } from '../hooks/useUser'
import { useDevices } from '../hooks/useDevices'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts'
import { Zap, Cpu, Bell, TrendingUp, ArrowUpRight, Sparkles } from 'lucide-react'

export default function DashboardPage() {
  const { userId } = useAuth()
  const { data: usage, isLoading: usageLoading, dataUpdatedAt } = useUsage(userId, 2, true)
  const { data: weekUsage } = useUsage(userId, 7)
  const { data: alerts } = useAlerts(userId)
  const { data: user } = useUser(userId)
  const { data: rawDevices } = useDevices(userId)

  const alertCount = alerts?.length ?? 0

  const devices = useMemo(() => {
    if (!rawDevices) return []
    return rawDevices.map(d => {
      const usageDevice = usage?.devices?.find(ud => ud.id === d.id)
      return {
        ...d,
        energyConsumed: usageDevice?.energyConsumed ?? 0,
        dailyUsage: usageDevice?.dailyUsage ?? null,
      }
    })
  }, [rawDevices, usage])

  // 1. Cost & Date configuration
  const rate = parseFloat(localStorage.getItem('energy_tracker_rate') || '8.0')

  const getLocalDateKey = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const now = new Date()
  const todayKey = getLocalDateKey(now)
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const yesterdayKey = getLocalDateKey(yesterday)

  // 2. Telemetry calculations (Today vs Yesterday)
  const totalKwhToday = devices.reduce((sum, d) => sum + (d.dailyUsage?.[todayKey] ?? 0), 0)
  const totalKwhYesterday = devices.reduce((sum, d) => sum + (d.dailyUsage?.[yesterdayKey] ?? 0), 0)

  const topConsumer = devices.length > 0
    ? devices.reduce((top, d) => (d.dailyUsage?.[todayKey] ?? 0) > (top.dailyUsage?.[todayKey] ?? 0) ? d : top, devices[0])
    : null

  // Delta calculations (Feature 7)
  let deltaPercent = 0
  let deltaText = '0% vs yesterday'
  let isDeltaPositive = false
  if (totalKwhYesterday > 0) {
    deltaPercent = ((totalKwhToday - totalKwhYesterday) / totalKwhYesterday) * 100
    isDeltaPositive = deltaPercent > 0
    deltaText = `${isDeltaPositive ? '▲' : '▼'} ${Math.abs(deltaPercent).toFixed(0)}% vs yesterday`
  } else if (totalKwhToday > 0) {
    deltaText = '▲ 100% vs yesterday'
    isDeltaPositive = true
  }

  // 3. Last updated ticker state (Feature 1)
  const [timeAgoText, setTimeAgoText] = useState('Updated just now')

  useEffect(() => {
    if (!dataUpdatedAt) return

    const updateTimeAgo = () => {
      const diffMs = Date.now() - dataUpdatedAt
      const diffMins = Math.floor(diffMs / 60000)

      if (diffMins < 1) {
        setTimeAgoText('Updated just now')
      } else {
        setTimeAgoText(`Updated ${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`)
      }
    }

    updateTimeAgo()
    const interval = setInterval(updateTimeAgo, 15000) // update every 15s
    return () => clearInterval(interval)
  }, [dataUpdatedAt])

  // 4. Sparkline Data (Feature 6)
  const sparklineData = useMemo(() => {
    if (!weekUsage?.devices) return []
    const points = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(now.getDate() - i)
      const dateKey = getLocalDateKey(date)
      const dailySum = weekUsage.devices.reduce((s, d) => s + (d.dailyUsage?.[dateKey] ?? 0), 0)
      points.push({ kWh: dailySum })
    }
    return points
  }, [weekUsage])

  // 5. Current Hourly load vs alert threshold (Feature 3)
  const HOURLY_LOADS: Record<string, number> = {
    THERMOSTAT: 1.5,
    HEATER: 2.4,
    FRIDGE: 0.48,
    AC: 2.1,
    WASHER: 1.8,
    OTHER: 0.9,
  }

  const currentHourlyUsage = devices.reduce((sum, d) => {
    if (d.status === 'OFF') return sum
    const base = HOURLY_LOADS[d.type.toUpperCase()] || 0.9
    return sum + base
  }, 0)

  const threshold = user?.energyAlertingThreshold ?? 150.0
  const percentage = threshold > 0 ? Math.min(100, (currentHourlyUsage / threshold) * 100) : 0
  let barColorClass = 'green'
  if (percentage >= 90) barColorClass = 'red'
  else if (percentage >= 75) barColorClass = 'orange'

  // 6. Top 3 consumers list (Feature 4)
  const topConsumersList = useMemo(() => {
    if (devices.length === 0 || totalKwhToday === 0) return []
    return [...devices]
      .map(d => {
        const consumed = d.dailyUsage?.[todayKey] ?? 0
        const percent = totalKwhToday > 0 ? (consumed / totalKwhToday) * 100 : 0
        return { ...d, consumed, percent }
      })
      .sort((a, b) => b.consumed - a.consumed)
      .slice(0, 3)
  }, [devices, totalKwhToday, todayKey])

  // 7. Build 7-day chart data
  const chartData = useMemo(() => {
    if (!weekUsage?.devices) return []

    const dataPoints = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(now.getDate() - i)
      const label = date.toLocaleDateString(undefined, { weekday: 'short' })
      const dateKey = getLocalDateKey(date)

      // Sum usage of all devices for this day
      const dailyKwh = weekUsage.devices.reduce((sum, d) => {
        const val = d.dailyUsage?.[dateKey] ?? 0
        return sum + val
      }, 0)

      dataPoints.push({ name: label, kWh: Number(dailyKwh.toFixed(2)) })
    }

    return dataPoints
  }, [weekUsage])

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Your energy at a glance</p>
      </div>

      {/* ── Device Status summary row (Feature 5) ── */}
      {devices.length > 0 && (
        <div className="device-pills-row" id="dash-device-pills">
          {devices.map(d => (
            <Link to={`/app/devices/${d.id}`} key={d.id} className={`device-pill device-pill--${d.status.toLowerCase()}`}>
              <span className="device-pill__dot"></span>
              <span className="device-pill__name">{d.name}</span>
            </Link>
          ))}
        </div>
      )}

      {/* ── Alert Threshold Proximity Warning (Feature 8) ── */}
      {user && !user.alerting && (
        <div className="alert-nudge-card" id="dash-alert-nudge">
          <div className="alert-nudge-body">
            <span className="alert-nudge-icon">📢</span>
            <div className="alert-nudge-text-col">
              <span className="alert-nudge-title">Stay on top of your bills</span>
              <p className="alert-nudge-desc">Set up energy consumption alerts to get notified before your daily usage spikes.</p>
            </div>
            <Link to="/app/settings/alerts" className="btn-secondary alert-nudge-btn" style={{ padding: '6px 12px', fontSize: 13, borderColor: '#FACC15', color: '#FACC15' }}>
              Enable Alerts →
            </Link>
          </div>
        </div>
      )}

      {/* ── Stats Row ── */}
      <div className="stats-row">
        <div className="stat-card" id="stat-total-kwh">
          <div className="stat-card__icon stat-card__icon--green"><Zap size={20} /></div>
          <div className="stat-card__body">
            <span className="stat-card__label">Total kWh Today</span>
            <div className="stat-card__value-container">
              <span className="stat-card__value">
                {usageLoading ? '—' : totalKwhToday.toFixed(2)}
              </span>
              {!usageLoading && (
                <span className="stat-card__cost" title={`Estimated cost at ₹${rate}/kWh`}>
                  ₹{(totalKwhToday * rate).toFixed(2)}
                </span>
              )}
              {sparklineData.length > 0 && (
                <div className="stat-card__sparkline">
                  <ResponsiveContainer width={50} height={20}>
                    <LineChart data={sparklineData}>
                      <Line type="monotone" dataKey="kWh" stroke="#4ADE80" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            <span className="stat-card__delta" style={{ color: isDeltaPositive ? '#EF4444' : '#4ADE80' }}>
              {deltaText}
            </span>
            <span className="stat-card__updated">{timeAgoText}</span>
          </div>
        </div>
        <div className="stat-card" id="stat-devices">
          <div className="stat-card__icon stat-card__icon--blue"><Cpu size={20} /></div>
          <div className="stat-card__body">
            <span className="stat-card__label">Active Devices</span>
            <span className="stat-card__value">{devices.length}</span>
            <span className="stat-card__updated">{timeAgoText}</span>
          </div>
        </div>
        <div className="stat-card" id="stat-alerts">
          <div className="stat-card__icon stat-card__icon--yellow"><Bell size={20} /></div>
          <div className="stat-card__body">
            <span className="stat-card__label">Alerts</span>
            <span className="stat-card__value">{alertCount}</span>
            <span className="stat-card__updated">{timeAgoText}</span>
          </div>
        </div>
        <div className="stat-card" id="stat-trend">
          <div className="stat-card__icon stat-card__icon--purple"><TrendingUp size={20} /></div>
          <div className="stat-card__body">
            <span className="stat-card__label">Top Consumer</span>
            <span className="stat-card__value">{topConsumer ? topConsumer.name : '—'}</span>
            <span className="stat-card__updated">{timeAgoText}</span>
          </div>
        </div>
      </div>

      {/* ── Current Hour Usage Bar (Feature 3) ── */}
      {user?.alerting && threshold > 0 && (
        <div className="current-hour-bar-card" id="dash-current-hour-bar">
          <div className="current-hour-bar-header">
            <span className="current-hour-bar-title">Current Hourly Rate vs. Alert Threshold</span>
            <span className="current-hour-bar-value">
              {currentHourlyUsage.toFixed(2)} kWh/h / {threshold.toFixed(0)} kWh/h ({percentage.toFixed(0)}%)
            </span>
          </div>
          <div className="current-hour-bar-track">
            <div 
              className={`current-hour-bar-fill current-hour-bar-fill--${barColorClass}`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          {percentage > 90 && (
            <p className="current-hour-bar-warning">
              ⚠️ Warning: Your current usage rate is very close to or exceeding your hourly alerting threshold!
            </p>
          )}
        </div>
      )}

      {/* ── Main Grid ── */}
      <div className="dashboard__grid">
        {/* Usage Chart */}
        <div className="dash-card dash-card--wide" id="dash-usage-chart">
          <h2 className="dash-card__title">Energy Usage (7 Days)</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" stroke="#71717A" fontSize={12} />
                <YAxis stroke="#71717A" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: '#18181B', border: '1px solid #27272A', borderRadius: 8, color: '#fff' }}
                />
                <Bar dataKey="kWh" fill="#4ADE80" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="dash-card__empty">No usage data yet</div>
          )}
        </div>

        {/* Right Column Container */}
        <div className="dashboard__side-col">
          {/* Top Consumers Card (Feature 4) */}
          <div className="dash-card" id="dash-top-consumers">
            <h2 className="dash-card__title"><TrendingUp size={16} /> Top Consumers</h2>
            {topConsumersList.length > 0 ? (
              <div className="top-consumers-list">
                {topConsumersList.map((d, index) => (
                  <div key={d.id} className="top-consumer-item">
                    <span className="top-consumer-rank">{index + 1}. {d.name}</span>
                    <div className="top-consumer-percentage-bar">
                      <div className="top-consumer-percentage-fill" style={{ width: `${d.percent}%` }}></div>
                    </div>
                    <span className="top-consumer-percent-text">{d.percent.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dash-card__empty">No active devices</div>
            )}
          </div>

          {/* Quick AI Tips */}
          <div className="dash-card" id="dash-ai-tips">
            <div className="dash-card__title-row">
              <h2 className="dash-card__title"><Sparkles size={16} /> AI Tips</h2>
              <Link to="/app/insights/tips" className="dash-card__link">
                Full analysis <ArrowUpRight size={14} />
              </Link>
            </div>
            <p className="dash-card__text">
              Get personalized energy-saving recommendations powered by AI analysis of your usage patterns.
            </p>
            <Link to="/app/insights/tips" className="dash-card__cta">
              View Saving Tips
            </Link>
          </div>
        </div>

        {/* Empty state for no devices */}
        {devices.length === 0 && !usageLoading && (
          <div className="dash-card" id="dash-empty-devices" style={{ gridColumn: '1 / -1' }}>
            <h2 className="dash-card__title">Get Started</h2>
            <p className="dash-card__text">Add your first smart device to start tracking energy consumption.</p>
            <Link to="/app/devices/new" className="dash-card__cta">
              + Add Your First Device
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
