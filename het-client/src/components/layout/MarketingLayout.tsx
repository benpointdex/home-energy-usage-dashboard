import { Outlet, Link, useLocation } from 'react-router-dom'
import './MarketingLayout.css'

const BoltIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#4ADE80" />
  </svg>
)

const ArrowUpRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
  </svg>
)

export default function MarketingLayout() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className="marketing-layout">
      {/* Only show nav on non-home pages (HomePage has its own nav) */}
      {!isHome && (
        <nav className="mkt-nav" id="marketing-nav">
          <div className="mkt-nav__inner">
            <Link to="/" className="mkt-nav__logo" id="mkt-nav-logo" aria-label="Home Energy Tracker Home">
              <span className="mkt-nav__logo-icon"><BoltIcon /></span>
              <span className="mkt-nav__logo-text">HET</span>
            </Link>

            <div className="mkt-nav__actions">
              <Link to="/login" className="mkt-nav__link" id="mkt-nav-login">Log In</Link>
              <Link to="/register" className="mkt-nav__cta" id="mkt-nav-signup">
                Sign Up <ArrowUpRight />
              </Link>
            </div>
          </div>
        </nav>
      )}

      <main className={isHome ? '' : 'mkt-main'}>
        <Outlet />
      </main>
    </div>
  )
}
