import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from '../constants/api'
import type { SandboxAdjustments, SandboxResult } from '../store'

export interface MonteCarloResult {
  scenario_label: string
  trajectories: { p10: number[]; p50: number[]; p90: number[] }
  wws_delta: number
  projected_net_worth_12m: number
}

export function useSandbox() {
  return useMutation<SandboxResult, Error, SandboxAdjustments>({
    mutationFn: async (adjustments) => {
      const { data } = await apiClient.post<SandboxResult>('/api/sandbox', adjustments)
      return data
    },
  })
}

export function useMonteCarlo() {
  return useMutation<MonteCarloResult, Error, { scenario: string; adjustments: SandboxAdjustments }>({
    mutationFn: async ({ scenario, adjustments }) => {
      const { data } = await apiClient.post<MonteCarloResult>('/api/sandbox/monte-carlo', { scenario, adjustments })
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
