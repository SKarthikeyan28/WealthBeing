import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from '../constants/api'
import type { SandboxAdjustments, SandboxResult } from '../store'

export function useSandbox() {
  return useMutation<SandboxResult, Error, { portfolio: unknown; adjustments: SandboxAdjustments; current_wws: number }>({
    mutationFn: async (body) => {
      const { data } = await apiClient.post('/api/sandbox', body)
      return data
    },
  })
}

export function useMonteCarlo() {
  return useMutation({
    mutationFn: async (body: { scenario: string; adjustments: SandboxAdjustments; portfolio: unknown }) => {
      const { data } = await apiClient.post('/api/sandbox/monte-carlo', body)
      return data
    },
  })
}

export function useScenarios() {
  return useQuery({
    queryKey: ['scenarios'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/scenarios')
      return data as Record<string, { label: string }>
    },
  })
}
