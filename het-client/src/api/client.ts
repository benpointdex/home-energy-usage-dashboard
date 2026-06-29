import axios, { type AxiosInstance } from 'axios'
import { tokenStore } from '../lib/tokenStore'
import { refreshAccessToken } from './auth'

const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL

export const apiClient: AxiosInstance = axios.create({
  baseURL: GATEWAY_URL,
  timeout: 10000,
})

// Request interceptor — attach Bearer token, proactively refresh if expiring soon
apiClient.interceptors.request.use(async (config) => {
  if (tokenStore.isExpiringSoon() && !tokenStore.isExpired()) {
    const tokens = tokenStore.get()
    if (tokens) {
      try {
        const refreshed = await refreshAccessToken()
        tokenStore.set({
          accessToken: refreshed.access_token,
          expiresAt: Date.now() + refreshed.expires_in * 1000,
        })
      } catch {
        // refresh failed — let the request proceed and 401 handler will redirect
      }
    }
  }

  const tokens = tokenStore.get()
  if (tokens) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`
  }
  return config
})

// Response interceptor — handle 401 with one retry after refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const tokens = tokenStore.get()
      if (tokens) {
        try {
          const refreshed = await refreshAccessToken()
          tokenStore.set({
            accessToken: refreshed.access_token,
            expiresAt: Date.now() + refreshed.expires_in * 1000,
          })
          original.headers.Authorization = `Bearer ${refreshed.access_token}`
          return apiClient(original)
        } catch {
          tokenStore.clear()
          window.location.href = '/login'
        }
      } else {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)
