import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../constants/api'

export function useScore(portfolio: unknown) {
  return useQuery({
    queryKey: ['score', portfolio],
    queryFn: async () => {
      const { data } = await apiClient.post('/api/score', portfolio)
      return data
    },
    enabled: !!portfolio,
  })
}
