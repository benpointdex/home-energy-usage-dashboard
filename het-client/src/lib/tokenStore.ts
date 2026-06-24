import { jwtDecode } from 'jwt-decode'

interface TokenData {
  accessToken: string
  expiresAt: number
}

let tokenData: TokenData | null = null

export const tokenStore = {
  set(data: TokenData) {
    tokenData = data
  },
  get(): TokenData | null {
    return tokenData
  },
  getAccessToken(): string | null {
    return tokenData?.accessToken ?? null
  },
  clear() {
    tokenData = null
  },
  isExpiringSoon(): boolean {
    if (!tokenData) return true
    const THIRTY_SECONDS = 30 * 1000
    return Date.now() > tokenData.expiresAt - THIRTY_SECONDS
  },
  isExpired(): boolean {
    if (!tokenData) return true
    return Date.now() > tokenData.expiresAt
  },
}

export function getUserIdFromToken(): number | null {
  const data = tokenStore.get()
  if (!data) return null
  try {
    const decoded = jwtDecode<{ het_user_id?: string }>(data.accessToken)
    return decoded.het_user_id ? parseInt(decoded.het_user_id) : null
  } catch {
    return null
  }
}
