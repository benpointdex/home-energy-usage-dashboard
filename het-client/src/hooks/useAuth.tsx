import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { tokenStore } from '../lib/tokenStore'
import { loginWithPassword, refreshAccessToken, logout as logoutApi } from '../api/auth'
import { userApi } from '../api/user'
import { jwtDecode } from 'jwt-decode'

interface JwtPayload {
  sub: string
  email?: string
  preferred_username?: string
  exp: number
}

interface AuthContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  userId: number | null
  userEmail: string | null
  setUserId: (id: number) => void
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<number | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  // ── On every page load: attempt silent refresh ───────────────────────────
  useEffect(() => {
    const attemptRestore = async () => {
      setIsLoading(true)
      try {
        const tokens = await refreshAccessToken()
        if (tokens) {
          tokenStore.set({
            accessToken: tokens.access_token,
            expiresAt: Date.now() + tokens.expires_in * 1000,
          })

          let resolvedEmail = ''
          try {
            const decoded = jwtDecode<JwtPayload>(tokens.access_token)
            resolvedEmail = decoded.email || decoded.preferred_username || ''
            setUserEmail(resolvedEmail)
          } catch (e) {
            console.error('Failed to decode restored token', e)
          }

          if (resolvedEmail) {
            try {
              const user = await userApi.getByEmail(resolvedEmail)
              setUserId(user.id)
            } catch (err) {
              console.error('Failed to resolve MySQL userId on refresh:', resolvedEmail, err)
            }
          }

          setIsAuthenticated(true)
        }
      } catch (err) {
        // no session or expired, ignore and let them login manually
      } finally {
        setIsLoading(false)
      }
    }

    attemptRestore()
  }, [])

  // Silent refresh timer
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = setInterval(async () => {
      if (tokenStore.isExpiringSoon() && !tokenStore.isExpired()) {
        try {
          const refreshed = await refreshAccessToken()
          tokenStore.set({
            accessToken: refreshed.access_token,
            expiresAt: Date.now() + refreshed.expires_in * 1000,
          })
        } catch {
          tokenStore.clear()
          setIsAuthenticated(false)
          setUserId(null)
          setUserEmail(null)
        }
      }
    }, 10000) // check every 10s

    return () => clearInterval(interval)
  }, [isAuthenticated])

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await loginWithPassword(email, password)
    tokenStore.set({
      accessToken: tokens.access_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
    })

    // Decode JWT to extract email
    let resolvedEmail = email
    try {
      const decoded = jwtDecode<JwtPayload>(tokens.access_token)
      resolvedEmail = decoded.email || decoded.preferred_username || email
      setUserEmail(resolvedEmail)
    } catch {
      setUserEmail(email)
    }

    try {
      const user = await userApi.getByEmail(resolvedEmail)
      setUserId(user.id)
    } catch (err) {
      console.error('Failed to resolve MySQL userId for email:', resolvedEmail, err)
    }

    setIsAuthenticated(true)
  }, [])

  const logout = useCallback(async () => {
    await logoutApi().catch(() => {})
    tokenStore.clear()
    setIsAuthenticated(false)
    setUserId(null)
    setUserEmail(null)
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, userId, userEmail, setUserId, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
