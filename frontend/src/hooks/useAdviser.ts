import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from '../constants/api'
import type { Sentiment } from '../constants/theme'

export interface AdviserChatPayload {
  message: string
  sentiment: Sentiment
}

export function useAdviserChat() {
  return useMutation<{ response: string }, Error, AdviserChatPayload>({
    mutationFn: async ({ message, sentiment }) => {
      const { data } = await apiClient.post<{ response: string }>('/api/adviser/chat', { message, sentiment })
      return data
    },
  })
}

export interface InsightItem {
  id: string
  vital: string
  title: string
  body: string
  prescribed_action: string
}

export function useInsights() {
  return useQuery({
    queryKey: ['adviser', 'insights'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ insights: InsightItem[] }>('/api/adviser/insights')
      return data
    },
  })
}

/** @deprecated Use useInsights */
export const useAdviserInsights = useInsights
