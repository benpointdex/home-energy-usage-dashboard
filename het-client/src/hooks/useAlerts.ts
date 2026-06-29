import { useQuery } from '@tanstack/react-query'
import { alertApi } from '../api/alert'

export function useAlerts(userId: number | null) {
  return useQuery({
    queryKey: ['alerts', userId],
    queryFn: () => alertApi.getByUserId(userId!),
    enabled: userId !== null,
  })
}
