import { create } from 'zustand'
import type { PanelId, Sentiment, Status } from '../constants/theme'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface VitalScore {
  score: number
  status: Status
  label: string
  weight: number
}

export type VitalsMap = Record<string, VitalScore>

export interface Portfolio {
  patient: { name: string; age: number; location: string }
  net_worth: number
  net_worth_history: { month: string; value: number }[]
  assets: Record<string, unknown>
  liabilities: Record<string, unknown>
  cashflow: {
    monthly_income: number
    monthly_expenses: Record<string, number>
    monthly_savings: number
    savings_rate: number
  }
  transactions: unknown[]
  goals: { id: string; name: string; target: number; current: number; deadline: string }[]
  scoring_inputs: Record<string, unknown>
}

export interface ClinicalNote {
  id: string
  rxId: string
  vital: string        // pillar key e.g. 'liquidity', 'risk_reward'
  text: string
  createdAt: string    // ISO 8601
}

export interface SandboxAdjustments {
  extra_savings: number
  debt_payoff: number
  equity_rebalance: number
  passive_income_increase: number
}

export interface SandboxResult {
  new_wws: number
  wws_delta: number
  updated_vitals: VitalsMap
  projection_12m: number
  diagnosis_summary: string
}

// ─── Store ───────────────────────────────────────────────────────────────────

interface WealthBeingStore {
  // Data
  portfolio: Portfolio | null
  wws: number | null
  vitals: VitalsMap | null
  diagnosisSummary: string | null
  prescribedActions: string[]

  // UI state
  persona: 'CLIENT' | 'ADVISER'
  sentiment: Sentiment
  activePanel: PanelId
  clinicalNotes: ClinicalNote[]

  // Sandbox state
  sandboxAdjustments: SandboxAdjustments
  sandboxResult: SandboxResult | null

  // Actions
  setPortfolio: (p: Portfolio) => void
  setWws: (w: number) => void
  setVitals: (v: VitalsMap) => void
  setDiagnosisSummary: (s: string) => void
  setPrescribedActions: (a: string[]) => void
  setPersona: (p: 'CLIENT' | 'ADVISER') => void
  setSentiment: (s: Sentiment) => void
  setActivePanel: (p: PanelId) => void
  addClinicalNote: (note: ClinicalNote) => void
  setSandboxAdjustment: (key: keyof SandboxAdjustments, value: number) => void
  setSandboxResult: (r: SandboxResult | null) => void
}

export const useStore = create<WealthBeingStore>((set) => ({
  portfolio: null,
  wws: null,
  vitals: null,
  diagnosisSummary: null,
  prescribedActions: [],

  persona: 'CLIENT',
  sentiment: 'okay',
  activePanel: 'pulse',
  clinicalNotes: [],

  sandboxAdjustments: {
    extra_savings: 0,
    debt_payoff: 0,
    equity_rebalance: 0,
    passive_income_increase: 0,
  },
  sandboxResult: null,

  setPortfolio: (portfolio) => set({ portfolio }),
  setWws: (wws) => set({ wws }),
  setVitals: (vitals) => set({ vitals }),
  setDiagnosisSummary: (diagnosisSummary) => set({ diagnosisSummary }),
  setPrescribedActions: (prescribedActions) => set({ prescribedActions }),
  setPersona: (persona) => set({ persona }),
  setSentiment: (sentiment) => set({ sentiment }),
  setActivePanel: (activePanel) => set({ activePanel }),
  addClinicalNote: (note) => set((s) => ({ clinicalNotes: [...s.clinicalNotes, note] })),
  setSandboxAdjustment: (key, value) =>
    set((s) => ({ sandboxAdjustments: { ...s.sandboxAdjustments, [key]: value } })),
  setSandboxResult: (sandboxResult) => set({ sandboxResult }),
}))
