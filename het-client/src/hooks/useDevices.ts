import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { deviceApi } from '../api/device'
import type { DeviceFormInput } from '../types/device'

export function useDevices(userId: number | null) {
  return useQuery({
    queryKey: ['devices', userId],
    queryFn: () => deviceApi.getByUserId(userId!),
    enabled: userId !== null,
  })
}

export function useDevice(deviceId: number | null) {
  return useQuery({
    queryKey: ['device', deviceId],
    queryFn: () => deviceApi.getById(deviceId!),
    enabled: deviceId !== null,
  })
}

export function useCreateDevice(userId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: DeviceFormInput) => deviceApi.create({ ...data, userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices', userId] })
    },
  })
}

export function useUpdateDevice(deviceId: number, userId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: DeviceFormInput) => deviceApi.update(deviceId, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['device', deviceId], updated)
      queryClient.invalidateQueries({ queryKey: ['devices', userId] })
    },
  })
}

export function useDeleteDevice(userId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (deviceId: number) => deviceApi.delete(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices', userId] })
    },
  })
}
