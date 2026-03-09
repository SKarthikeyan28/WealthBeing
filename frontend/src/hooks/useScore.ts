import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from '../constants/api'
import type { VitalsMap } from '../store'

export interface ScoreResponse {
  wws: number
  health_label: string
  diagnosis_summary: string
  prescribed_actions: string[]
  vitals: VitalsMap
  critical_vitals: string[]
}

export function useScore(portfolio: unknown) {
  return useQuery({
    queryKey: ['score', portfolio],
    queryFn: async () => {
      const { data } = await apiClient.post<ScoreResponse>('/api/score', portfolio)
      return data
    },
    enabled: !!portfolio,
  })
}

export function useSubmitMyPortfolio() {
  return useMutation<ScoreResponse, Error, import('../store').Portfolio>({
    mutationFn: async (portfolio) => {
      const { data } = await apiClient.post<ScoreResponse>('/api/score', portfolio)
      return data
    },
  })
}
