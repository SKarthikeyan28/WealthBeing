import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from '../constants/api'
import type { Sentiment } from '../constants/theme'
import { useStore } from '../store'

export interface AdviserChatPayload {
  message: string
  sentiment: Sentiment
}

function getHealthLabel(wws: number): string {
  if (wws >= 900) return 'Excellent Health'
  if (wws >= 750) return 'Good Health'
  if (wws >= 600) return 'Moderate Health'
  if (wws >= 400) return 'Requires Attention'
  return 'Critical'
}

export function useAdviserChat() {
  const portfolio = useStore((s) => s.portfolio)
  const wws = useStore((s) => s.wws)
  const vitals = useStore((s) => s.vitals)

  return useMutation<{ response: string }, Error, AdviserChatPayload>({
    mutationFn: async ({ message, sentiment }) => {
      const score = wws ?? 724
      const wws_data = {
        wws: score,
        health_label: getHealthLabel(score),
        vitals: vitals ?? {},
        critical_vitals: Object.entries(vitals ?? {})
          .filter(([, v]) => v.status === 'monitor' || v.status === 'critical')
          .map(([k]) => k),
      }
      const { data } = await apiClient.post<{ response: string }>('/api/adviser/chat', {
        message,
        sentiment,
        portfolio: portfolio ?? {},
        wws_data,
      })
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
