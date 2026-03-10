import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'
import StatusBadge from '../components/StatusBadge'
import type { Status } from '../constants/theme'
import { colours } from '../constants/theme'
import { apiClient } from '../constants/api'
import type { Portfolio } from '../store'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, Legend, ResponsiveContainer,
} from 'recharts'

const VITAL_ORDER = ['diversification', 'liquidity', 'behavioral', 'growth_momentum', 'risk_reward'] as const

// Static peer cohort benchmark scores (same axis order as VITAL_ORDER)
const COHORT_SCORES: Record<typeof VITAL_ORDER[number], number> = {
  diversification:  70,
  liquidity:        75,
  behavioral:       78,
  growth_momentum:  72,
  risk_reward:      69,
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface MetricCard {
  label: string
  value: string
  status: Status
  note: string
}

function MetricCardWithPopover({ m }: { m: MetricCard }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div ref={wrapRef} className="rounded-xl border border-border bg-surface p-4 flex flex-col gap-2 relative">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">
          {m.label}
        </p>
        <button
          type="button"
          aria-label={`Info about ${m.label}`}
          onClick={() => setOpen((o) => !o)}
          className="shrink-0 w-5 h-5 rounded-full border border-border bg-surface text-text-muted hover:text-white hover:border-teal flex items-center justify-center text-xs font-bold transition-colors"
        >
          ?
        </button>
      </div>
      {open && (
        <div
          className="absolute top-10 right-4 z-10 min-w-[200px] max-w-[280px] rounded-lg border border-border bg-bg p-3 shadow-lg text-xs text-text-muted leading-snug"
          role="tooltip"
        >
          {m.note}
        </div>
      )}
      <p className="text-xl font-semibold text-white leading-tight">{m.value}</p>
      <StatusBadge status={m.status} />
      <p className="text-xs text-text-muted leading-snug mt-0.5">{m.note}</p>
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Vitals() {
  const vitals    = useStore((s) => s.vitals)
  const portfolio = useStore((s) => s.portfolio)
  const setPortfolio = useStore((s) => s.setPortfolio)
  const user = useStore((s) => s.user)

  const userPrefsFromPortfolio = portfolio && 'user_preferences' in portfolio ? (portfolio as Portfolio).user_preferences : undefined
  const [targetEmergencyMonths, setTargetEmergencyMonths] = useState(userPrefsFromPortfolio?.emergency_months_target ?? 6)
  const [targetSavingsRatePct, setTargetSavingsRatePct] = useState(userPrefsFromPortfolio?.savings_rate_target_pct ?? 30)
  const [savingTargets, setSavingTargets] = useState(false)
  useEffect(() => {
    const e = userPrefsFromPortfolio?.emergency_months_target ?? 6
    const s = userPrefsFromPortfolio?.savings_rate_target_pct ?? 30
    setTargetEmergencyMonths(e)
    setTargetSavingsRatePct(s)
  }, [userPrefsFromPortfolio?.emergency_months_target, userPrefsFromPortfolio?.savings_rate_target_pct])

  if (!vitals) {
    return (
      <div className="h-full overflow-y-auto bg-bg p-6 space-y-6">
        <div className="rounded-xl border border-border bg-surface p-4 h-80 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-4 space-y-2">
              <div className="h-2 rounded bg-border animate-pulse w-24" />
              <div className="h-6 rounded bg-border animate-pulse w-16" />
              <div className="h-4 rounded-full bg-border animate-pulse w-20" />
              <div className="h-2 rounded bg-border animate-pulse w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Radar data — user scores + peer cohort overlay ──
  const radarData = VITAL_ORDER.map((key) => ({
    pillar: vitals[key]?.label ?? key,
    score:  vitals[key]?.score ?? 0,
    cohort: COHORT_SCORES[key],
    fullMark: 100,
  }))

  // ── Derived values for metric cards ──
  const cashflow     = portfolio?.cashflow
  const allExpenses  = cashflow?.monthly_expenses
    ? Object.values(cashflow.monthly_expenses).reduce((a, b) => a + b, 0)
    : 0

  const assets       = portfolio?.assets as Record<string, unknown> | undefined
  const liabilities  = portfolio?.liabilities as Record<string, unknown> | undefined

  const emergencyFund = (assets?.cash as { emergency_fund?: number } | undefined)?.emergency_fund ?? 0
  const savingsAcct   = (assets?.cash as { savings_account?: number } | undefined)?.savings_account ?? 0
  const monthsEF      = allExpenses > 0 ? Math.round((emergencyFund / allExpenses) * 10) / 10 : 0
  const savingsRatePct = cashflow ? Math.round(cashflow.savings_rate * 100) : 0

  const equitiesAsset = (portfolio?.assets as { equities?: { holdings?: { ticker: string; pct_of_equity: number }[] } } | undefined)
  const topHolding    = equitiesAsset?.equities?.holdings?.[0]
  const topPct        = topHolding ? Math.round((topHolding.pct_of_equity ?? 0) * 100) : 0

  const scoringInputs = portfolio?.scoring_inputs as { yoy_net_worth_growth?: number } | undefined
  const yoyGrowth     = scoringInputs?.yoy_net_worth_growth != null
    ? (scoringInputs.yoy_net_worth_growth * 100).toFixed(1)
    : '—'

  const netWorth        = portfolio?.net_worth ?? 0
  const liquidityRatioN = netWorth > 0 ? Math.round(((emergencyFund + savingsAcct) / netWorth) * 1000) / 10 : 0

  const mortgage  = (liabilities?.hdb_mortgage as { outstanding?: number } | undefined)?.outstanding ?? 0
  const ccDebt    = (liabilities?.credit_card  as { outstanding?: number } | undefined)?.outstanding ?? 0
  // Gross assets = net worth + total liabilities (balance-sheet identity)
  const totalLiabilities = mortgage + ccDebt
  const grossAssets      = netWorth + totalLiabilities
  const debtToAssetPct   = grossAssets > 0 ? Math.round((totalLiabilities / grossAssets) * 100) : 0

  const emergencyMonthsTarget = targetEmergencyMonths
  const savingsRateTargetPct  = targetSavingsRatePct

  // ── 8-metric scorecard ──
  const metrics: MetricCard[] = [
    {
      label:  'Emergency fund',
      value:  `${monthsEF} months`,
      status: monthsEF >= emergencyMonthsTarget ? 'healthy' : monthsEF >= emergencyMonthsTarget * 0.65 ? 'monitor' : 'critical',
      note:   `Target: ${emergencyMonthsTarget} months of expenses`,
    },
    {
      label:  'Savings rate',
      value:  `${savingsRatePct}%`,
      status: savingsRatePct >= savingsRateTargetPct ? 'healthy' : savingsRatePct >= savingsRateTargetPct * 0.65 ? 'monitor' : 'critical',
      note:   `Target rate: ${savingsRateTargetPct}% of monthly income`,
    },
    {
      label:  'Concentration risk',
      value:  topHolding ? `${topPct}% ${topHolding.ticker}` : '—',
      status: topPct <= 35 ? 'healthy' : topPct <= 40 ? 'monitor' : 'critical',
      note:   topPct > 35 ? `${topHolding?.ticker ?? 'Top holding'} above 35% safe threshold` : 'Within safe concentration limits',
    },
    {
      label:  'Debt-to-asset ratio',
      value:  `${debtToAssetPct}%`,
      status: debtToAssetPct < 30 ? 'healthy' : debtToAssetPct < 50 ? 'monitor' : 'critical',
      note:   debtToAssetPct < 30 ? 'Below 30% — healthy threshold' : 'Consider reducing liabilities',
    },
    {
      label:  'Behavioural resilience',
      value:  `${vitals.behavioral?.score ?? 0}/100`,
      status: (vitals.behavioral?.status as Status) ?? 'healthy',
      note:   '1 panic-sell event recorded in March 2025',
    },
    {
      label:  'Diversification',
      value:  `${vitals.diversification?.score ?? 0}/100`,
      status: (vitals.diversification?.status as Status) ?? 'healthy',
      note:   '6 asset classes across portfolio',
    },
    {
      label:  'Net worth growth YoY',
      value:  `+${yoyGrowth}%`,
      status: 'healthy',
      note:   'S$298k → S$342k over 12 months',
    },
    {
      label:  'Liquidity ratio',
      value:  `${liquidityRatioN}%`,
      status: liquidityRatioN >= 15 ? 'healthy' : liquidityRatioN >= 10 ? 'monitor' : 'critical',
      note:   'Target: 15% of net worth in liquid assets',
    },
  ]

  const handleSaveTargets = async () => {
    if (!portfolio) return
    setSavingTargets(true)
    const updated: Portfolio = {
      ...portfolio,
      user_preferences: {
        emergency_months_target: Math.max(1, Math.min(24, targetEmergencyMonths)),
        savings_rate_target_pct: Math.max(5, Math.min(80, targetSavingsRatePct)),
      },
    }
    setPortfolio(updated)
    if (user) {
      await apiClient.put('/api/user/portfolio', updated).catch(() => {})
    }
    setSavingTargets(false)
  }

  return (
    <div className="h-full overflow-y-auto bg-bg p-6 space-y-6">

      {/* ── Radar chart ── */}
      <div className="rounded-xl border border-border bg-surface p-4 h-80">
        <p className="text-sm font-medium text-white mb-2">Pillar scores vs peer cohort</p>
        <ResponsiveContainer width="100%" height="90%">
          <RadarChart data={radarData} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
            <PolarGrid stroke={colours.border} />
            <PolarAngleAxis
              dataKey="pillar"
              tick={{ fontSize: 10, fill: colours.textMuted }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fontSize: 9, fill: colours.textMuted }}
              axisLine={false}
            />

            {/* Peer cohort — purple dashed, no fill */}
            <Radar
              name="Peer cohort"
              dataKey="cohort"
              stroke={colours.purple}
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fill="transparent"
            />

            {/* Your scores — teal fill */}
            <Radar
              name="You"
              dataKey="score"
              stroke={colours.teal}
              strokeWidth={2}
              fill={colours.teal}
              fillOpacity={0.25}
            />

            <Legend
              iconType="line"
              wrapperStyle={{ fontSize: 11, color: colours.textMuted }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Your targets (editable) ── */}
      {portfolio && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm font-medium text-white mb-3">Your targets</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-text-muted mb-1">Emergency fund target (months)</label>
              <input
                type="number"
                min={1}
                max={24}
                value={targetEmergencyMonths}
                onChange={(e) => setTargetEmergencyMonths(Number(e.target.value) || 6)}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:border-teal"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Savings rate target (%)</label>
              <input
                type="number"
                min={5}
                max={80}
                value={targetSavingsRatePct}
                onChange={(e) => setTargetSavingsRatePct(Number(e.target.value) || 30)}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:border-teal"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleSaveTargets}
            disabled={savingTargets}
            className="mt-3 px-4 py-2 rounded-lg text-sm font-medium text-bg disabled:opacity-50"
            style={{ backgroundColor: colours.teal }}
          >
            {savingTargets ? 'Saving…' : 'Save targets'}
          </button>
        </div>
      )}

      {/* ── 8-metric scorecard ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map((m) => (
          <MetricCardWithPopover key={m.label} m={m} />
        ))}
      </div>
    </div>
  )
}
