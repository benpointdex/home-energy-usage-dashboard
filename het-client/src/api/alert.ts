import { apiClient } from './client'
import type { AlertDto } from '../types/alert'

export const alertApi = {
  getByUserId: (userId: number) =>
    apiClient.get<AlertDto[]>(`/api/v1/alert/user/${userId}`).then(r => r.data),
}
