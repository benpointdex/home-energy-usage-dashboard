import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { LayoutDashboard, Cpu, BarChart2, Sparkles, Bell, Settings, LogOut, Zap, ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import './AppLayout.css'

const navItems = [
  { to: '/app', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/app/devices', icon: Cpu, label: 'Devices' },
  { to: '/app/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/app/insights/tips', icon: Sparkles, label: 'AI Insights' },
  { to: '/app/alerts', icon: Bell, label: 'Alerts' },
  { to: '/app/settings/profile', icon: Settings, label: 'Settings' },
]



export default function AppLayout() {
  const { logout, userEmail } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)


  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className={`app-layout ${collapsed ? 'app-layout--collapsed' : ''}`}>
      {/* ── Sidebar ── */}
      <aside className="sidebar" id="app-sidebar">
        <div className="sidebar__header">
          <div className="sidebar__logo">
            <Zap size={22} color="#4ADE80" />
            {!collapsed && <span className="sidebar__logo-text">HET</span>}
          </div>
          <button
            className="sidebar__toggle"
            onClick={() => setCollapsed(c => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        <nav className="sidebar__nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}

        </nav>

        <div className="sidebar__footer">
          {!collapsed && userEmail && (
            <div className="sidebar__user">
              <div className="sidebar__user-avatar">
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <span className="sidebar__user-email">{userEmail}</span>
            </div>
          )}
          <button className="sidebar__logout" onClick={handleLogout} title="Log out">
            <LogOut size={18} />
            {!collapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="app-main" id="app-main">
        <Outlet />
      </main>
    </div>
  )
}
