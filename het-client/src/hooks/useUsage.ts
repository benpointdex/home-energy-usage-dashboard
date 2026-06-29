import { useQuery, useQueryClient } from '@tanstack/react-query'
import { usageApi } from '../api/usage'
import { useEffect } from 'react'

export function useUsage(userId: number | null, days: number = 3, poll = false) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['usage', userId, days],
    queryFn: () => usageApi.getUsage(userId!, days),
    enabled: userId !== null,
    refetchInterval: poll ? 60 * 1000 : false,
  })

  // Stop polling when tab is backgrounded
  useEffect(() => {
    if (!poll) return
    const handleVisibility = () => {
      if (document.hidden) {
        queryClient.cancelQueries({ queryKey: ['usage', userId, days] })
      } else {
        queryClient.invalidateQueries({ queryKey: ['usage', userId, days] })
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [poll, userId, days, queryClient])

  return query
}
