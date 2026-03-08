import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../constants/api'
import { useStore } from '../store'
import type { Portfolio, VitalsMap } from '../store'

export interface DashboardResponse {
  patient: { name: string; age: number; location: string }
  net_worth: number
  net_worth_history: { month: string; value: number }[]
  wws: number
  health_label: string
  diagnosis_summary: string
  vitals: VitalsMap
  critical_vitals: string[]
  prescribed_actions: string[]
  assets?: Record<string, unknown>
  liabilities?: Record<string, unknown>
  cashflow?: Portfolio['cashflow']
  transactions?: unknown[]
  goals?: { id: string; name: string; target: number; current: number; deadline: string }[]
  scoring_inputs?: Record<string, unknown>
}

function toPortfolio(d: DashboardResponse): Portfolio {
  return {
    patient: d.patient,
    net_worth: d.net_worth,
    net_worth_history: d.net_worth_history,
    assets: d.assets ?? {},
    liabilities: d.liabilities ?? {},
    cashflow: d.cashflow ?? {
      monthly_income: 0,
      monthly_expenses: {},
      monthly_savings: 0,
      savings_rate: 0,
    },
    transactions: d.transactions ?? [],
    goals: d.goals ?? [],
    scoring_inputs: d.scoring_inputs ?? {},
  }
}

export function useDashboard() {
  const setPortfolio = useStore((s) => s.setPortfolio)
  const setWws = useStore((s) => s.setWws)
  const setVitals = useStore((s) => s.setVitals)
  const setDiagnosisSummary = useStore((s) => s.setDiagnosisSummary)
  const setPrescribedActions = useStore((s) => s.setPrescribedActions)

  const query = useQuery<DashboardResponse>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await apiClient.get<DashboardResponse>('/api/dashboard')
      return data
    },
    staleTime: 60_000,
  })

  useEffect(() => {
    if (!query.data) return
    const d = query.data
    setPortfolio(toPortfolio(d))
    setWws(d.wws)
    setVitals(d.vitals)
    setDiagnosisSummary(d.diagnosis_summary)
    setPrescribedActions(d.prescribed_actions)
  }, [query.data, setPortfolio, setWws, setVitals, setDiagnosisSummary, setPrescribedActions])

  return query
}
