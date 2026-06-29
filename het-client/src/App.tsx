import { Routes, Route, Navigate } from 'react-router-dom'
import MarketingLayout from './components/layout/MarketingLayout'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/common/ProtectedRoute'
import PublicOnlyRoute from './components/common/PublicOnlyRoute'

// Public Pages
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

// Protected Pages
import DashboardPage from './pages/DashboardPage'
import DeviceListPage from './pages/DeviceListPage'
import DeviceDetailPage from './pages/DeviceDetailPage'
import AddDevicePage from './pages/AddDevicePage'
import EditDevicePage from './pages/EditDevicePage'
import AnalyticsPage from './pages/AnalyticsPage'
import SavingTipsPage from './pages/SavingTipsPage'
import OverviewPage from './pages/OverviewPage'
import AlertSettingsPage from './pages/AlertSettingsPage'
import AlertHistoryPage from './pages/AlertHistoryPage'
import ProfilePage from './pages/ProfilePage'


export default function App() {


  return (
    <Routes>
      {/* Part 1 — Public Marketing Site */}
      <Route element={<MarketingLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />
      </Route>

      {/* Part 2 — Authenticated App Dashboard */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="devices" element={<DeviceListPage />} />
        <Route path="devices/new" element={<AddDevicePage />} />
        <Route path="devices/:deviceId" element={<DeviceDetailPage />} />
        <Route path="devices/:deviceId/edit" element={<EditDevicePage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="insights/tips" element={<SavingTipsPage />} />
        <Route path="insights/overview" element={<OverviewPage />} />
        <Route path="settings/alerts" element={<AlertSettingsPage />} />
        <Route path="alerts" element={<AlertHistoryPage />} />
        <Route path="settings/profile" element={<ProfilePage />} />

        
        {/* Redirect unknown dashboard routes */}
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Route>

      {/* Redirect all other unknown root routes to homepage */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
