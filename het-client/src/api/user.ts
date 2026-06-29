import { apiClient } from './client'
import type { UserDto, RegistrationDto } from '../types/user'

export const userApi = {
  register: (data: RegistrationDto) =>
    apiClient.post<UserDto>('/api/v1/user/register', data).then(r => r.data),

  getById: (id: number) =>
    apiClient.get<UserDto>(`/api/v1/user/${id}`).then(r => r.data),

  getByEmail: (email: string) =>
    apiClient.get<UserDto>('/api/v1/user/by-email', { params: { email } }).then(r => r.data),

  update: (id: number, data: UserDto) =>
    apiClient.put<UserDto>(`/api/v1/user/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    apiClient.delete(`/api/v1/user/${id}`),
}
