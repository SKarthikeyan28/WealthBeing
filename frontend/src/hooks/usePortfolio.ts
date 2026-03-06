import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../constants/api'
import type { Portfolio } from '../store'

export function usePortfolio() {
  return useQuery<Portfolio>({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/portfolio')
      return data
    },
  })
}

export function usePortfolioHistory() {
  return useQuery<{ month: string; value: number }[]>({
    queryKey: ['portfolio', 'history'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/portfolio/history')
      return data
    },
  })
}

export function useCashFlow() {
  return useQuery({
    queryKey: ['portfolio', 'cashflow'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/portfolio/cashflow')
      return data
    },
  })
}
