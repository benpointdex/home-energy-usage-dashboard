import { apiClient } from './client'
import type { InsightDto } from '../types/insight'

export const insightApi = {
  getSavingTips: (userId: number) =>
    apiClient.get<InsightDto>(`/api/v1/insight/saving-tips/${userId}`, { timeout: 120000 }).then(r => r.data),

  getOverview: (userId: number) =>
    apiClient.get<InsightDto>(`/api/v1/insight/overview/${userId}`, { timeout: 120000 }).then(r => r.data),

  savingTipsStreamUrl: (userId: number) =>
    `${import.meta.env.VITE_GATEWAY_URL}/api/v1/insight/saving-tips/${userId}/stream`,

  overviewStreamUrl: (userId: number) =>
    `${import.meta.env.VITE_GATEWAY_URL}/api/v1/insight/overview/${userId}/stream`,
}
