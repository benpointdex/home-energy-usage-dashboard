const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL

interface TokenResponse {
  access_token: string
  expires_in: number
}

/**
 * Login — gateway sets httpOnly cookie with refresh_token,
 * returns access_token in body.
 */
export async function loginWithPassword(email: string, password: string): Promise<TokenResponse> {
  const response = await fetch(`${GATEWAY_URL}/auth/login`, {
    method: 'POST',
    credentials: 'include', // REQUIRED: allows browser to receive + store the cookie
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error ?? 'Login failed')
  }

  return response.json()
}

/**
 * Silent refresh — called on every page load or when access token expires.
 * Browser automatically sends the httpOnly cookie.
 * Returns new access_token if session is still valid.
 */
export async function refreshAccessToken(): Promise<TokenResponse> {
  const response = await fetch(`${GATEWAY_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include', // REQUIRED: sends the httpOnly cookie
  })

  if (!response.ok) {
    throw new Error('Session expired')
  }

  return response.json()
}

/**
 * Logout — gateway clears the httpOnly cookie server-side.
 */
export async function logout(): Promise<void> {
  await fetch(`${GATEWAY_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include', // REQUIRED: sends cookie so gateway can revoke it
  }).catch(() => {}) // always continue even if logout call fails
}
