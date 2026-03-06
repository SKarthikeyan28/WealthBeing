import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from '../constants/api'
import type { Sentiment } from '../constants/theme'

export function useAdviserChat() {
  return useMutation<{ response: string }, Error, { message: string; sentiment: Sentiment; portfolio: unknown; wws_data: unknown }>({
    mutationFn: async (body) => {
      const { data } = await apiClient.post('/api/adviser/chat', body)
      return data
    },
  })
}

export function useAdviserInsights() {
  return useQuery({
    queryKey: ['adviser', 'insights'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/adviser/insights')
      return data as {
        insights: {
          id: string
          vital: string
          title: string
          body: string
          prescribed_action: string
        }[]
      }
    },
  })
}
