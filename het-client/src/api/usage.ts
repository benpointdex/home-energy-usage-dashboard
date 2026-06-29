import { apiClient } from './client'
import type { UsageDto } from '../types/usage'

export const usageApi = {
  getUsage: (userId: number, days: number = 3) =>
    apiClient.get<UsageDto>(`/api/v1/usage/${userId}`, { params: { days } }).then(r => r.data),
}
