import { apiClient } from './client'
import type { DeviceDto, DeviceFormInput } from '../types/device'

export const deviceApi = {
  getById: (id: number) =>
    apiClient.get<DeviceDto>(`/api/v1/device/${id}`).then(r => r.data),

  getByUserId: (userId: number) =>
    apiClient.get<DeviceDto[]>(`/api/v1/device/user/${userId}`).then(r => r.data),

  create: (data: DeviceFormInput & { userId: number }) =>
    apiClient.post<DeviceDto>('/api/v1/device', data).then(r => r.data),

  update: (id: number, data: DeviceFormInput) =>
    apiClient.put<DeviceDto>(`/api/v1/device/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    apiClient.delete(`/api/v1/device/${id}`),

  toggleStatus: (id: number, status: 'ON' | 'OFF') =>
    apiClient.put<DeviceDto>(`/api/v1/device/${id}/status`, { status }).then(r => r.data),
}
