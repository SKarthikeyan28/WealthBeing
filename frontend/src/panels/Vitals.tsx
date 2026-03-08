import { useStore } from '../store'
import StatusBadge from '../components/StatusBadge'
import type { Status } from '../constants/theme'
import { colours } from '../constants/theme'
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

// ─── Component ───────────────────────────────────────────────────────────────

export default function Vitals() {
  const vitals    = useStore((s) => s.vitals)
  const portfolio = useStore((s) => s.portfolio)

  if (!vitals) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="rounded-xl border border-border bg-surface h-48 w-64 animate-pulse" />
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

  // ── 8-metric scorecard ──
  const metrics: MetricCard[] = [
    {
      label:  'Emergency fund',
      value:  `${monthsEF} months`,
      status: monthsEF >= 6 ? 'healthy' : monthsEF >= 4 ? 'monitor' : 'critical',
      note:   'Target: 6 months of expenses',
    },
    {
      label:  'Savings rate',
      value:  `${savingsRatePct}%`,
      status: savingsRatePct >= 30 ? 'healthy' : savingsRatePct >= 20 ? 'monitor' : 'critical',
      note:   'Target rate: 30% of monthly income',
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

      {/* ── 8-metric scorecard ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-border bg-surface p-4 flex flex-col gap-2">
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">
              {m.label}
            </p>
            <p className="text-xl font-semibold text-white leading-tight">{m.value}</p>
            <StatusBadge status={m.status} />
            <p className="text-xs text-text-muted leading-snug mt-0.5">{m.note}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
