import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useAlerts } from '../hooks/useAlerts'
import { Bell, Filter, RefreshCw, CheckCircle, XCircle } from 'lucide-react'
import './AlertHistoryPage.css'

type FilterPeriod = 'all' | '24h' | '7d' | '30d'

export default function AlertHistoryPage() {
  const { userId } = useAuth()
  const { data: alerts = [], isLoading, isRefetching, refetch } = useAlerts(userId)
  const [period, setPeriod] = useState<FilterPeriod>('all')

  // Client-side date filter
  const filteredAlerts = alerts.filter(alert => {
    if (period === 'all') return true
    const alertTime = new Date(alert.createdAt).getTime()
    const now = Date.now()
    const diffMs = now - alertTime

    if (period === '24h') {
      return diffMs <= 24 * 60 * 60 * 1000
    }
    if (period === '7d') {
      return diffMs <= 7 * 24 * 60 * 60 * 1000
    }
    if (period === '30d') {
      return diffMs <= 30 * 24 * 60 * 60 * 1000
    }
    return true
  })

  const formatTimestamp = (isoString: string) => {
    const d = new Date(isoString)
    return d.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  return (
    <div className="alerts-page">
      <div className="alerts-page__header">
        <div>
          <h1 className="page-title">Alert History</h1>
          <p className="page-subtitle">Historical log of threshold breaches and notifications</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="btn btn--outline refresh-btn"
          aria-label="Refresh alerts"
        >
          <RefreshCw size={14} className={isRefetching ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="alerts-filters">
        <div className="filter-group">
          <Filter size={14} className="filter-icon" />
          <button
            onClick={() => setPeriod('all')}
            className={`filter-btn ${period === 'all' ? 'filter-btn--active' : ''}`}
          >
            All Time
          </button>
          <button
            onClick={() => setPeriod('24h')}
            className={`filter-btn ${period === '24h' ? 'filter-btn--active' : ''}`}
          >
            Last 24 Hours
          </button>
          <button
            onClick={() => setPeriod('7d')}
            className={`filter-btn ${period === '7d' ? 'filter-btn--active' : ''}`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setPeriod('30d')}
            className={`filter-btn ${period === '30d' ? 'filter-btn--active' : ''}`}
          >
            Last 30 Days
          </button>
        </div>
        <div className="alerts-count">
          Showing {filteredAlerts.length} {filteredAlerts.length === 1 ? 'alert' : 'alerts'}
        </div>
      </div>

      {isLoading ? (
        <div className="alerts-list skeleton-loading">
          <div className="skeleton-row" style={{ height: '70px', marginBottom: '12px' }} />
          <div className="skeleton-row" style={{ height: '70px', marginBottom: '12px' }} />
          <div className="skeleton-row" style={{ height: '70px', marginBottom: '12px' }} />
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="alerts-empty-state" id="alerts-empty">
          <div className="empty-state-icon-wrapper">
            <CheckCircle size={32} className="empty-state-success-icon" />
          </div>
          <h2 className="empty-state-title">No alerts triggered</h2>
          <p className="empty-state-text">
            {period === 'all'
              ? "Your energy usage is within your limits. Great job!"
              : "No threshold breaches recorded during this period."}
          </p>
        </div>
      ) : (
        <div className="alerts-list">
          {filteredAlerts.map(alert => (
            <div key={alert.id} className="alert-item" id={`alert-item-${alert.id}`}>
              <div className="alert-item__icon-container">
                <Bell size={18} className="alert-item__icon" />
              </div>
              <div className="alert-item__content">
                <div className="alert-item__title">
                  Energy Usage Threshold Exceeded
                </div>
                <div className="alert-item__time">
                  {formatTimestamp(alert.createdAt)}
                </div>
              </div>
              <div className="alert-item__badge-wrapper">
                {alert.sent ? (
                  <span className="badge badge--success">
                    <CheckCircle size={12} style={{ marginRight: '4px' }} />
                    Email Sent
                  </span>
                ) : (
                  <span className="badge badge--error">
                    <XCircle size={12} style={{ marginRight: '4px' }} />
                    Failed to Send
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
