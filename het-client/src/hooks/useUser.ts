import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi } from '../api/user'
import type { UserDto } from '../types/user'

export function useUser(userId: number | null) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => userApi.getById(userId!),
    enabled: userId !== null,
  })
}

export function useUpdateUser(userId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UserDto) => userApi.update(userId, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['user', userId], updated)
    },
  })
}
